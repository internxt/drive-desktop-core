import { writeTelemetryEntry } from './write-telemetry-entry';
import type { HttpTelemetryPayload } from './qa-telemetry.types';

type AppendFileFn = (path: string, data: string, callback: (err: Error | null) => void) => void;

type Props = HttpTelemetryPayload & {
  logsPath: string;
  destinationPath?: string;
  appendFn?: AppendFileFn;
};

export function recordHttpTelemetry(props: Props) {
  const { logsPath, destinationPath, appendFn, ...payload } = props;
  writeTelemetryEntry({
    entry: {
      category: 'HTTP',
      timestamp: new Date().toISOString(),
      ...payload,
    },
    logsPath,
    destinationPath,
    appendFn,
  });
}
