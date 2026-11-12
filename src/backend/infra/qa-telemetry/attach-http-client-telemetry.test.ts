import type { AxiosInstance } from 'axios';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { attachHttpClientTelemetry } from './attach-http-client-telemetry';

describe('attachHttpClientTelemetry', () => {
  const originalEnv = { ...process.env };
  const logsPath = join('internxt', 'qa-telemetry-logs');

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it('should attach axios interceptors when client is an AxiosInstance', () => {
    process.env.NODE_ENV = 'development';
    const requestUse = vi.fn();
    const responseUse = vi.fn();
    const client = {
      interceptors: {
        request: { use: requestUse },
        response: { use: responseUse },
      },
    } as unknown as AxiosInstance;

    attachHttpClientTelemetry({ client, logsPath });

    expect(requestUse).toHaveBeenCalledTimes(1);
    expect(responseUse).toHaveBeenCalledTimes(1);
  });

  it('should register openapi-fetch middleware when client exposes use()', () => {
    process.env.NODE_ENV = 'development';
    const use = vi.fn();
    const client = { use };

    attachHttpClientTelemetry({ client, logsPath });

    expect(use).toHaveBeenCalledTimes(1);
    expect(use.mock.calls[0]![0]).toEqual(
      expect.objectContaining({
        onRequest: expect.any(Function),
        onResponse: expect.any(Function),
        onError: expect.any(Function),
      }),
    );
  });

  it('should not attach anything when telemetry is disabled', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.ENABLE_QA_TELEMETRY;
    const requestUse = vi.fn();
    const use = vi.fn();

    attachHttpClientTelemetry({
      client: {
        interceptors: {
          request: { use: requestUse },
          response: { use: vi.fn() },
        },
      } as unknown as AxiosInstance,
      logsPath,
    });

    attachHttpClientTelemetry({ client: { use }, logsPath });

    expect(requestUse).not.toHaveBeenCalled();
    expect(use).not.toHaveBeenCalled();
  });

  it('should throw when client is not axios nor openapi-fetch', () => {
    process.env.NODE_ENV = 'development';

    expect(() => attachHttpClientTelemetry({ client: {}, logsPath })).toThrow(
      'HTTP telemetry: unsupported client (expected AxiosInstance or openapi-fetch client with .use())',
    );
  });
});
