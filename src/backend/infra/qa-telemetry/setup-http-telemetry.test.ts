import type { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import http from 'node:http';
import { join } from 'node:path';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { attachHttpTelemetryInterceptor } from './attach-http-telemetry-interceptor';
import { createHttpTelemetryInterceptors } from './create-http-telemetry-interceptors';
import { setupHttpTelemetry } from './setup-http-telemetry';

describe('setupHttpTelemetry', () => {
  const originalEnv = { ...process.env };
  const logsPath = join('internxt', 'qa-telemetry-logs');

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it('should attach interceptors to axios instance when enabled', () => {
    process.env.NODE_ENV = 'development';
    const requestUse = vi.fn();
    const responseUse = vi.fn();
    const mockHttp = {
      interceptors: {
        request: { use: requestUse },
        response: { use: responseUse },
      },
    } as unknown as AxiosInstance;

    attachHttpTelemetryInterceptor({ http: mockHttp, logsPath });

    expect(requestUse).toHaveBeenCalledTimes(1);
    expect(responseUse).toHaveBeenCalledTimes(1);
  });

  it('should not attach interceptors when disabled', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.ENABLE_QA_TELEMETRY;
    const requestUse = vi.fn();
    const responseUse = vi.fn();
    const mockHttp = {
      interceptors: {
        request: { use: requestUse },
        response: { use: responseUse },
      },
    } as unknown as AxiosInstance;

    attachHttpTelemetryInterceptor({ http: mockHttp, logsPath });

    expect(requestUse).not.toHaveBeenCalled();
    expect(responseUse).not.toHaveBeenCalled();
  });

  it('should record successful HTTP request duration through interceptors', () => {
    const recordMock = vi.fn();
    const { onRequestFulfilled, onResponseFulfilled } = createHttpTelemetryInterceptors({
      logsPath,
      onRecord: recordMock,
    });

    const config = {
      method: 'get',
      url: 'https://example.com/api/test',
    } as InternalAxiosRequestConfig;

    const configured = onRequestFulfilled(config);
    expect(configured).toBe(config);

    const response = {
      status: 200,
      config,
    } as AxiosResponse;

    const returned = onResponseFulfilled(response);
    expect(returned).toBe(response);

    expect(recordMock).toHaveBeenCalledTimes(1);
    expect(recordMock).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        url: 'https://example.com/api/test',
        status: 200,
        durationMs: expect.any(Number),
      }),
    );
  });

  it('should record rejected HTTP request error through interceptors', async () => {
    const recordMock = vi.fn();
    const { onRequestFulfilled, onResponseRejected } = createHttpTelemetryInterceptors({
      logsPath,
      onRecord: recordMock,
    });

    const config = {
      method: 'post',
      url: 'https://example.com/api/fail',
    } as InternalAxiosRequestConfig;

    onRequestFulfilled(config);

    const error = {
      message: 'Network error',
      config,
      response: { status: 500 },
    } as unknown as AxiosError;

    await expect(onResponseRejected(error)).rejects.toBe(error);

    expect(recordMock).toHaveBeenCalledTimes(1);
    expect(recordMock).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        url: 'https://example.com/api/fail',
        status: 500,
        error: 'Network error',
        durationMs: expect.any(Number),
      }),
    );
  });

  it('should intercept node http.request calls via setupHttpTelemetry', () => {
    process.env.NODE_ENV = 'development';
    const recordMock = vi.fn();
    setupHttpTelemetry({ logsPath, onRecord: recordMock });

    const req = http.request('http://example.com/items', () => undefined);
    req.emit('response', { statusCode: 200 });

    expect(recordMock).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        url: 'http://example.com/items',
        status: 200,
        durationMs: expect.any(Number),
      }),
    );
  });

  it('should intercept node http.request error events via setupHttpTelemetry', () => {
    process.env.NODE_ENV = 'development';
    const recordMock = vi.fn();
    setupHttpTelemetry({ logsPath, onRecord: recordMock });

    const req = http.request('http://example.com/broken', () => undefined);
    req.emit('error', new Error('Connection failed'));

    expect(recordMock).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        url: 'http://example.com/broken',
        status: 0,
        error: 'Connection failed',
        durationMs: expect.any(Number),
      }),
    );
  });
});
