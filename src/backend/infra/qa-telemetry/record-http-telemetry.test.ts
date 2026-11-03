import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { recordHttpTelemetry } from './record-http-telemetry';

describe('recordHttpTelemetry', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it('should record HTTP telemetry with category and timestamp', () => {
    process.env.NODE_ENV = 'development';
    const mockAppend = vi.fn((_path, _data, cb) => cb(null));

    recordHttpTelemetry({
      method: 'POST',
      url: '/api/folders',
      durationMs: 250,
      status: 201,
      logsPath: '/tmp/logs',
      appendFn: mockAppend,
    });

    expect(mockAppend).toHaveBeenCalledTimes(1);
    const serialized = String(mockAppend.mock.calls[0][1]);
    const parsed = JSON.parse(serialized);

    expect(parsed).toMatchObject({
      category: 'HTTP',
      method: 'POST',
      url: '/api/folders',
      durationMs: 250,
      status: 201,
    });
    expect(parsed.timestamp).toBeDefined();
  });
});
