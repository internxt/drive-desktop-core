import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

import type { HttpTelemetryPayload } from './qa-telemetry.types';
import { recordHttpTelemetry } from './record-http-telemetry';

type RecordHandler = (props: HttpTelemetryPayload) => void;

type Props = {
  logsPath: string;
  onRecord?: RecordHandler;
};

export type OpenApiFetchTelemetryMiddleware = {
  onRequest: (params: { request: Request }) => Request | Promise<Request>;
  onResponse: (params: { request: Request; response: Response }) => Response | Promise<Response>;
  onError: (params: { request: Request; error: unknown }) => void | Promise<void>;
};

export type HttpTelemetryAxiosHandlers = {
  onRequestFulfilled: (config: InternalAxiosRequestConfig) => InternalAxiosRequestConfig;
  onResponseFulfilled: (response: AxiosResponse) => AxiosResponse;
  onResponseRejected: (error: AxiosError) => Promise<never>;
};

export type HttpTelemetryInstrumentation = {
  axios: HttpTelemetryAxiosHandlers;
  openApiFetch: OpenApiFetchTelemetryMiddleware;
};

function formatThrownError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export function createHttpTelemetryInstrumentation({ logsPath, onRecord }: Props): HttpTelemetryInstrumentation {
  const record =
    onRecord ??
    ((payload: HttpTelemetryPayload) => {
      recordHttpTelemetry({ ...payload, logsPath });
    });
  const requestStartTimes = new WeakMap<object, number>();

  function markRequestStart(key: object) {
    requestStartTimes.set(key, performance.now());
  }

  function resolveDurationMs(key: object | undefined) {
    const startTime = key ? requestStartTimes.get(key) : undefined;
    if (startTime === undefined) {
      return 0;
    }
    return performance.now() - startTime;
  }

  const axios: HttpTelemetryAxiosHandlers = {
    onRequestFulfilled(config) {
      markRequestStart(config);
      return config;
    },
    onResponseFulfilled(response) {
      const config = response.config;
      record({
        method: config?.method?.toUpperCase() ?? 'GET',
        url: config?.url ?? '',
        durationMs: resolveDurationMs(config),
        status: response.status,
      });
      return response;
    },
    onResponseRejected(error) {
      const config = error.config;
      record({
        method: config?.method?.toUpperCase() ?? 'GET',
        url: config?.url ?? '',
        durationMs: resolveDurationMs(config),
        status: error.response?.status ?? 0,
        error: error.message,
      });
      return Promise.reject(error);
    },
  };

  const openApiFetch: OpenApiFetchTelemetryMiddleware = {
    onRequest({ request }) {
      markRequestStart(request);
      return request;
    },
    onResponse({ request, response }) {
      record({
        method: request.method.toUpperCase(),
        url: request.url,
        durationMs: resolveDurationMs(request),
        status: response.status,
      });
      return response;
    },
    onError({ request, error }) {
      record({
        method: request.method.toUpperCase(),
        url: request.url,
        durationMs: resolveDurationMs(request),
        status: 0,
        error: formatThrownError(error),
      });
      throw error;
    },
  };

  return { axios, openApiFetch };
}
