import type { AxiosInstance } from 'axios';

import { createHttpTelemetryInterceptors } from './create-http-telemetry-interceptors';
import { isTelemetryEnabled } from './is-telemetry-enabled';
import type { HttpTelemetryPayload } from './qa-telemetry.types';

type RecordHandler = (props: HttpTelemetryPayload) => void;

type Props = {
  http: AxiosInstance;
  logsPath: string;
  onRecord?: RecordHandler;
};

export function attachHttpTelemetryInterceptor({ http, logsPath, onRecord }: Props) {
  if (!isTelemetryEnabled()) {
    return;
  }

  const { onRequestFulfilled, onResponseFulfilled, onResponseRejected } = createHttpTelemetryInterceptors({
    logsPath,
    onRecord,
  });
  http.interceptors.request.use(onRequestFulfilled);
  http.interceptors.response.use(onResponseFulfilled, onResponseRejected);
}
