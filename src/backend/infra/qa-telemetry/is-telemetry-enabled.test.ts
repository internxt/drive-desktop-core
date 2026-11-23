import { describe, expect, it, beforeEach, afterEach } from 'vitest';

import { isTelemetryEnabled } from './is-telemetry-enabled';

describe('isTelemetryEnabled', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('should be enabled when NODE_ENV is development', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.ENABLE_QA_TELEMETRY;

    expect(isTelemetryEnabled()).toBe(true);
  });

  it('should be enabled when ENABLE_QA_TELEMETRY is true even in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.ENABLE_QA_TELEMETRY = 'true';

    expect(isTelemetryEnabled()).toBe(true);
  });

  it('should be disabled when NODE_ENV is production and ENABLE_QA_TELEMETRY is not set', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.ENABLE_QA_TELEMETRY;

    expect(isTelemetryEnabled()).toBe(false);
  });
});
