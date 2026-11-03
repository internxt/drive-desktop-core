import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { QA_TELEMETRY_FILENAME } from './qa-telemetry.constants';
import { writeTelemetryEntry } from './write-telemetry-entry';

describe('writeTelemetryEntry', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it('should append entry to file when telemetry is enabled', () => {
    process.env.NODE_ENV = 'development';
    const mockAppend = vi.fn((_path, _data, cb) => cb(null));

    writeTelemetryEntry({
      entry: {
        category: 'HTTP',
        timestamp: '2026-10-07T12:00:00.000Z',
        method: 'GET',
        url: '/api/files',
        durationMs: 120.5,
        status: 200,
      },
      logsPath: '/tmp/logs',
      appendFn: mockAppend,
    });

    expect(mockAppend).toHaveBeenCalledTimes(1);
    const callArgs = mockAppend.mock.calls[0];
    expect(callArgs[0]).toBe(`/tmp/logs/${QA_TELEMETRY_FILENAME}`);
    expect(callArgs[1]).toContain('"category":"HTTP"');
    expect(callArgs[1]).toContain('"durationMs":120.5');
  });

  it('should not append entry when telemetry is disabled', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.ENABLE_QA_TELEMETRY;
    const mockAppend = vi.fn();

    writeTelemetryEntry({
      entry: {
        category: 'HTTP',
        timestamp: '2026-10-07T12:00:00.000Z',
        method: 'GET',
        url: '/api/files',
        durationMs: 120.5,
        status: 200,
      },
      logsPath: '/tmp/logs',
      appendFn: mockAppend,
    });

    expect(mockAppend).not.toHaveBeenCalled();
  });
});
