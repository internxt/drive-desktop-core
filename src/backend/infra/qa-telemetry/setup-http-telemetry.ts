import http from 'node:http';
import https from 'node:https';

import { extractHttpRequestDetails } from './extract-http-request-details';
import { isTelemetryEnabled } from './is-telemetry-enabled';
import type { HttpTelemetryPayload } from './qa-telemetry.types';
import { recordHttpTelemetry } from './record-http-telemetry';
import { resolveFetchInputUrl } from './resolve-fetch-input-url';

type RecordHandler = (props: HttpTelemetryPayload) => void;

type Props = {
  logsPath: string;
  onRecord?: RecordHandler;
};

type HttpModule = typeof http | typeof https;

type NetClientRequest = {
  on(event: 'response', handler: (response: { statusCode?: number }) => void): void;
  on(event: 'error', handler: (err: Error) => void): void;
};

type ElectronNet = {
  request(options: unknown): NetClientRequest;
};

let isHttpTelemetryInitialized = false;
let activeRecordHandler: RecordHandler = () => {};

function attachRequestTelemetryHandlers({
  clientRequest,
  method,
  url,
  startTime,
  recordHandler,
}: {
  clientRequest: http.ClientRequest;
  method: string;
  url: string;
  startTime: number;
  recordHandler: RecordHandler;
}) {
  clientRequest.once('response', (response: http.IncomingMessage) => {
    recordHandler({
      method,
      url,
      durationMs: performance.now() - startTime,
      status: response.statusCode ?? 0,
    });
  });

  clientRequest.once('error', (error: Error) => {
    recordHandler({
      method,
      url,
      durationMs: performance.now() - startTime,
      status: 0,
      error: error.message,
    });
  });
}

function patchHttpModule(mod: HttpModule, isHttps: boolean, recordHandler: RecordHandler) {
  const originalRequest = mod.request;

  mod.request = function (this: unknown, ...args: Parameters<typeof originalRequest>) {
    const { method, url, socketPath } = extractHttpRequestDetails(args, isHttps);

    if (socketPath) {
      return originalRequest.apply(this, args);
    }

    const startTime = performance.now();
    const clientRequest = originalRequest.apply(this, args);

    attachRequestTelemetryHandlers({
      clientRequest,
      method,
      url,
      startTime,
      recordHandler,
    });

    return clientRequest;
  } as typeof originalRequest;

  mod.get = function (this: unknown, ...args: Parameters<HttpModule['get']>) {
    const req = mod.request.apply(this, args as Parameters<typeof mod.request>);
    req.end();
    return req;
  } as typeof mod.get;
}

function extractElectronNetRequestDetails(options: unknown) {
  let method = 'GET';
  let url = '';

  if (typeof options === 'string') {
    url = options;
  } else if (options && typeof options === 'object') {
    const opts = options as Record<string, unknown>;
    if (typeof opts.method === 'string') {
      method = opts.method.toUpperCase();
    }
    if (typeof opts.url === 'string') {
      url = opts.url;
    }
  }

  return { method, url };
}

function patchElectronNet(recordHandler: RecordHandler) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const electron = require('electron') as typeof import('electron');
    const net = electron.net as ElectronNet | undefined;
    if (!net || typeof net.request !== 'function') {
      return;
    }

    const originalNetRequest = net.request.bind(net);
    net.request = function (options: unknown) {
      const { method, url } = extractElectronNetRequestDetails(options);
      const startTime = performance.now();
      const clientRequest = originalNetRequest(options);

      clientRequest.on('response', (response: { statusCode?: number }) => {
        recordHandler({
          method,
          url,
          durationMs: performance.now() - startTime,
          status: response.statusCode ?? 0,
        });
      });

      clientRequest.on('error', (err: Error) => {
        recordHandler({
          method,
          url,
          durationMs: performance.now() - startTime,
          status: 0,
          error: err.message,
        });
      });

      return clientRequest;
    };
  } catch {
    // Ignore in non-electron environments
  }
}

function patchGlobalFetch(recordHandler: RecordHandler) {
  if (typeof globalThis.fetch !== 'function') {
    return;
  }

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
    const startTime = performance.now();
    const method = init?.method?.toUpperCase() ?? 'GET';
    const url = resolveFetchInputUrl(input);

    try {
      const response = await originalFetch.call(this, input, init);
      recordHandler({
        method,
        url,
        durationMs: performance.now() - startTime,
        status: response.status,
      });
      return response;
    } catch (error) {
      recordHandler({
        method,
        url,
        durationMs: performance.now() - startTime,
        status: 0,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  };
}

export function setupHttpTelemetry({ logsPath, onRecord }: Props) {
  activeRecordHandler =
    onRecord ??
    ((payload: HttpTelemetryPayload) => {
      recordHttpTelemetry({ ...payload, logsPath });
    });

  if (isHttpTelemetryInitialized || !isTelemetryEnabled()) {
    return;
  }
  isHttpTelemetryInitialized = true;

  const modules: Array<[HttpModule, boolean]> = [
    [http, false],
    [https, true],
  ];

  for (const [mod, isHttps] of modules) {
    patchHttpModule(mod, isHttps, activeRecordHandler);
  }

  patchElectronNet(activeRecordHandler);
  patchGlobalFetch(activeRecordHandler);
}
