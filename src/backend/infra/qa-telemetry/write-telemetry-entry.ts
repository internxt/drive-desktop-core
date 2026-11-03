import { appendFile, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

import { getTelemetryFilePath } from './get-telemetry-file-path';
import { isTelemetryEnabled } from './is-telemetry-enabled';
import type { HttpTelemetryEntry } from './qa-telemetry.types';

type AppendFileFn = (path: string, data: string, callback: (err: Error | null) => void) => void;

type Props = {
  entry: HttpTelemetryEntry;
  logsPath: string;
  destinationPath?: string;
  appendFn?: AppendFileFn;
};

export function writeTelemetryEntry({ entry, logsPath, destinationPath, appendFn = appendFile }: Props) {
  if (!isTelemetryEnabled()) {
    return;
  }

  const targetPath = destinationPath ?? getTelemetryFilePath({ logsPath });
  const serializedEntry = `${JSON.stringify(entry)}\n`;

  try {
    mkdirSync(dirname(targetPath), { recursive: true });
  } catch {
    // Ignore directory creation failure when it already exists
  }

  appendFn(targetPath, serializedEntry, () => {
    // Non-blocking write to avoid interrupting runtime flow
  });
}
