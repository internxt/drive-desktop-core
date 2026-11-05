import { join, win32 } from 'node:path';

import { describe, expect, it } from 'vitest';

import { getTelemetryFilePath } from './get-telemetry-file-path';
import { QA_TELEMETRY_FILENAME } from './qa-telemetry.constants';

describe('getTelemetryFilePath', () => {
  it('should build destination path ending with qa-telemetry.json in the logs directory', () => {
    const logsPath = join('internxt', 'logs');
    const resolved = getTelemetryFilePath({ logsPath });

    expect(resolved).toBe(join(logsPath, QA_TELEMETRY_FILENAME));
  });

  it.runIf(process.platform === 'win32')(
    'should build destination path under Electron AppData logs folder on Windows',
    () => {
      const logsPath = win32.join('C:', 'Users', 'test', 'AppData', 'Roaming', 'internxt', 'logs');
      const resolved = getTelemetryFilePath({ logsPath });

      expect(resolved).toBe(win32.join(logsPath, QA_TELEMETRY_FILENAME));
    },
  );
});
