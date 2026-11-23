import { join } from 'node:path';

import { QA_TELEMETRY_FILENAME } from './qa-telemetry.constants';

type Props = {
  logsPath: string;
};

export function getTelemetryFilePath({ logsPath }: Props) {
  return join(logsPath, QA_TELEMETRY_FILENAME);
}
