import type { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import http from 'node:http';
import https from 'node:https';
import { join } from 'node:path';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { attachHttpClientTelemetry } from './attach-http-client-telemetry';
import { createHttpTelemetryInstrumentation } from './create-http-telemetry-instrumentation';
import { extractHttpRequestDetails } from './extract-http-request-details';
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

    attachHttpClientTelemetry({ client: mockHttp, logsPath });

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

    attachHttpClientTelemetry({ client: mockHttp, logsPath });

    expect(requestUse).not.toHaveBeenCalled();
    expect(responseUse).not.toHaveBeenCalled();
  });

  it('should record successful HTTP request duration through interceptors', () => {
    const recordMock = vi.fn();
    const { onRequestFulfilled, onResponseFulfilled } = createHttpTelemetryInstrumentation({
      logsPath,
      onRecord: recordMock,
    }).axios;

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
    const { onRequestFulfilled, onResponseRejected } = createHttpTelemetryInstrumentation({
      logsPath,
      onRecord: recordMock,
    }).axios;

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

  it('should intercept https.request calls built from options', () => {
    process.env.NODE_ENV = 'development';
    const recordMock = vi.fn();
    setupHttpTelemetry({ logsPath, onRecord: recordMock });

    const req = https.request(
      {
        hostname: 'secure.example.com',
        path: '/vault',
        method: 'POST',
      },
      () => undefined,
    );
    req.emit('response', { statusCode: 201 });

    expect(recordMock).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        url: 'https://secure.example.com/vault',
        status: 201,
      }),
    );
  });

  it('should skip telemetry for unix socket requests', async () => {
    vi.resetModules();
    process.env.NODE_ENV = 'development';
    const recordMock = vi.fn();
    const fakeSocketRequest = new (await import('node:events')).EventEmitter();
    const httpMod = await import('node:http');
    const originalRequest = httpMod.default.request;

    vi.spyOn(httpMod.default, 'request').mockImplementation(function (this: unknown, ...args) {
      if (extractHttpRequestDetails(args, false).socketPath) {
        return fakeSocketRequest as http.ClientRequest;
      }
      return originalRequest.apply(this, args);
    });

    const { setupHttpTelemetry: freshSetup } = await import('./setup-http-telemetry');
    freshSetup({ logsPath, onRecord: recordMock });

    httpMod.default.request({ socketPath: join('internxt', 'runtime', 'app.sock'), path: '/health' });
    fakeSocketRequest.emit('response', { statusCode: 200 });

    expect(recordMock).not.toHaveBeenCalled();
  });

  it('should update active record handler on subsequent setupHttpTelemetry calls', () => {
    process.env.NODE_ENV = 'development';
    const firstRecord = vi.fn();
    const secondRecord = vi.fn();
    setupHttpTelemetry({ logsPath, onRecord: firstRecord });
    setupHttpTelemetry({ logsPath, onRecord: secondRecord });

    const req = http.request('http://example.com/switch-handler', () => undefined);
    req.emit('response', { statusCode: 200 });

    expect(firstRecord).not.toHaveBeenCalled();
    expect(secondRecord).toHaveBeenCalled();
  });

  it('should intercept global fetch success and failure', async () => {
    vi.resetModules();
    const recordMock = vi.fn();
    const underlying = vi.fn();
    underlying.mockResolvedValueOnce(new Response(null, { status: 204 }));
    underlying.mockRejectedValueOnce(new Error('fetch failed'));
    globalThis.fetch = underlying as typeof fetch;
    process.env.NODE_ENV = 'development';

    const { setupHttpTelemetry: freshSetup } = await import('./setup-http-telemetry');
    freshSetup({ logsPath, onRecord: recordMock });

    await globalThis.fetch(new URL('https://example.com/fetch-ok'), { method: 'PUT' });
    await expect(globalThis.fetch(new Request('https://example.com/fetch-fail'))).rejects.toThrow('fetch failed');

    expect(recordMock).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'PUT',
        url: 'https://example.com/fetch-ok',
        status: 204,
      }),
    );

    expect(recordMock).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        url: 'https://example.com/fetch-fail',
        status: 0,
        error: 'fetch failed',
      }),
    );
  });

  it('should not patch transports when telemetry is disabled', async () => {
    vi.resetModules();
    process.env.NODE_ENV = 'production';
    delete process.env.ENABLE_QA_TELEMETRY;
    const recordMock = vi.fn();
    const underlying = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    globalThis.fetch = underlying as typeof fetch;

    const { setupHttpTelemetry: freshSetup } = await import('./setup-http-telemetry');
    freshSetup({ logsPath, onRecord: recordMock });

    await globalThis.fetch('https://example.com/no-telemetry');

    expect(recordMock).not.toHaveBeenCalled();
    expect(underlying).toHaveBeenCalledTimes(1);
  });

  it('should record via recordHttpTelemetry when setup has no onRecord handler', async () => {
    vi.resetModules();
    process.env.NODE_ENV = 'development';
    const recordMock = vi.fn();
    vi.doMock('./record-http-telemetry', () => ({
      recordHttpTelemetry: recordMock,
    }));

    const { setupHttpTelemetry: freshSetup } = await import('./setup-http-telemetry');
    freshSetup({ logsPath });

    const req = http.request('http://example.com/default-record', () => undefined);
    req.emit('response', { statusCode: 200 });

    expect(recordMock).toHaveBeenCalledWith(expect.objectContaining({ logsPath, url: 'http://example.com/default-record' }));
  });
});
