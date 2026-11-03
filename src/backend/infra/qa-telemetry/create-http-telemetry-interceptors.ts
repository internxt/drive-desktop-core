import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

import { recordHttpTelemetry } from './record-http-telemetry';
import type { HttpTelemetryPayload } from './qa-telemetry.types';

type RecordHandler = (props: HttpTelemetryPayload) => void;

type Props = {
  logsPath: string;
  onRecord?: RecordHandler;
};

export function createHttpTelemetryInterceptors({ logsPath, onRecord }: Props) {
  const record =
    onRecord ??
    ((payload: HttpTelemetryPayload) => {
      recordHttpTelemetry({ ...payload, logsPath });
    });
  const requestStartTimes = new WeakMap<object, number>();

  function onRequestFulfilled(config: InternalAxiosRequestConfig) {
    requestStartTimes.set(config, performance.now());
    return config;
  }

  function onResponseFulfilled(response: AxiosResponse) {
    const startTime = response.config ? requestStartTimes.get(response.config) : undefined;
    const durationMs = startTime !== undefined ? performance.now() - startTime : 0;

    record({
      method: response.config?.method?.toUpperCase() ?? 'GET',
      url: response.config?.url ?? '',
      durationMs,
      status: response.status,
    });

    return response;
  }

  function onResponseRejected(error: AxiosError) {
    const config = error.config;
    const startTime = config ? requestStartTimes.get(config) : undefined;
    const durationMs = startTime !== undefined ? performance.now() - startTime : 0;

    record({
      method: config?.method?.toUpperCase() ?? 'GET',
      url: config?.url ?? '',
      durationMs,
      status: error.response?.status ?? 0,
      error: error.message,
    });

    return Promise.reject(error);
  }

  return { onRequestFulfilled, onResponseFulfilled, onResponseRejected };
}
