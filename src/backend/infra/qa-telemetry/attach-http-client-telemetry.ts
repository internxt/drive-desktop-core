import type { AxiosInstance } from 'axios';

import { createHttpTelemetryInstrumentation, type OpenApiFetchTelemetryMiddleware } from './create-http-telemetry-instrumentation';
import { isTelemetryEnabled } from './is-telemetry-enabled';
import type { HttpTelemetryPayload } from './qa-telemetry.types';

type RecordHandler = (props: HttpTelemetryPayload) => void;

type OpenApiFetchClient = {
  use: (middleware: OpenApiFetchTelemetryMiddleware) => void;
};

type HttpTelemetryClient = AxiosInstance | OpenApiFetchClient;

type Props = {
  client: HttpTelemetryClient;
  logsPath: string;
  onRecord?: RecordHandler;
};

function isAxiosClient(client: HttpTelemetryClient): client is AxiosInstance {
  return 'interceptors' in client && typeof client.interceptors?.request?.use === 'function';
}

function isOpenApiFetchClient(client: HttpTelemetryClient): client is OpenApiFetchClient {
  return !('interceptors' in client) && typeof client.use === 'function';
}

function attachToAxios({ client, logsPath, onRecord }: { client: AxiosInstance; logsPath: string; onRecord?: RecordHandler }) {
  const { onRequestFulfilled, onResponseFulfilled, onResponseRejected } = createHttpTelemetryInstrumentation({
    logsPath,
    onRecord,
  }).axios;
  client.interceptors.request.use(onRequestFulfilled);
  client.interceptors.response.use(onResponseFulfilled, onResponseRejected);
}

function attachToOpenApiFetch({ client, logsPath, onRecord }: { client: OpenApiFetchClient; logsPath: string; onRecord?: RecordHandler }) {
  const { openApiFetch } = createHttpTelemetryInstrumentation({ logsPath, onRecord });
  client.use(openApiFetch);
}

export function attachHttpClientTelemetry({ client, logsPath, onRecord }: Props) {
  if (!isTelemetryEnabled()) {
    return;
  }

  if (isAxiosClient(client)) {
    attachToAxios({ client, logsPath, onRecord });
    return;
  }

  if (isOpenApiFetchClient(client)) {
    attachToOpenApiFetch({ client, logsPath, onRecord });
    return;
  }

  throw new Error('HTTP telemetry: unsupported client (expected AxiosInstance or openapi-fetch client with .use())');
}
