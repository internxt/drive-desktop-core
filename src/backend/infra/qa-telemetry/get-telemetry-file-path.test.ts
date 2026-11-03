import { describe, expect, it } from 'vitest';

import { getTelemetryFilePath } from './get-telemetry-file-path';
import { QA_TELEMETRY_FILENAME } from './qa-telemetry.constants';

describe('getTelemetryFilePath', () => {
  it('should build destination path ending with qa-telemetry.json in the logs directory', () => {
    const logsPath = '/test/logs/directory';
    const resolved = getTelemetryFilePath({ logsPath });

    expect(resolved).toBe(`/test/logs/directory/${QA_TELEMETRY_FILENAME}`);
  });
});
