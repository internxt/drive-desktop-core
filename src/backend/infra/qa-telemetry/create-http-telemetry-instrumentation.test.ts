import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { partialSpyOn } from '@/tests/vitest/utils.helper.test';

import { createHttpTelemetryInstrumentation } from './create-http-telemetry-instrumentation';
import * as recordHttpTelemetryModule from './record-http-telemetry';

describe('createHttpTelemetryInstrumentation', () => {
  const logsPath = join('internxt', 'qa-telemetry-logs');
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv, NODE_ENV: 'development' };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it('should record successful axios responses through shared instrumentation', () => {
    const recordMock = vi.fn();
    const { axios } = createHttpTelemetryInstrumentation({ logsPath, onRecord: recordMock });

    const config = {
      method: 'get',
      url: 'https://example.com/api/test',
    } as InternalAxiosRequestConfig;

    axios.onRequestFulfilled(config);

    const response = {
      status: 200,
      config,
    } as AxiosResponse;

    axios.onResponseFulfilled(response);

    expect(recordMock).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        url: 'https://example.com/api/test',
        status: 200,
        durationMs: expect.any(Number),
      }),
    );
  });

  it('should record openapi-fetch middleware request lifecycle', async () => {
    const recordMock = vi.fn();
    const { openApiFetch } = createHttpTelemetryInstrumentation({ logsPath, onRecord: recordMock });
    const request = new Request('https://example.com/api/items', { method: 'post' });

    await openApiFetch.onRequest({ request });

    const response = new Response(null, { status: 201 });
    await openApiFetch.onResponse({ request, response });

    expect(recordMock).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        url: 'https://example.com/api/items',
        status: 201,
        durationMs: expect.any(Number),
      }),
    );
  });

  it('should record openapi-fetch middleware errors and rethrow', async () => {
    const recordMock = vi.fn();
    const { openApiFetch } = createHttpTelemetryInstrumentation({ logsPath, onRecord: recordMock });
    const request = new Request('https://example.com/api/fail');
    const failure = new Error('Network down');

    await openApiFetch.onRequest({ request });

    expect(() => openApiFetch.onError({ request, error: failure })).toThrow(failure);

    expect(recordMock).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        url: 'https://example.com/api/fail',
        status: 0,
        error: 'Network down',
        durationMs: expect.any(Number),
      }),
    );
  });

  it('should record rejected axios requests through shared instrumentation', async () => {
    const recordMock = vi.fn();
    const { axios } = createHttpTelemetryInstrumentation({ logsPath, onRecord: recordMock });

    const config = {
      method: 'delete',
      url: 'https://example.com/api/resource',
    } as InternalAxiosRequestConfig;

    axios.onRequestFulfilled(config);

    const error = {
      message: 'Server error',
      config,
      response: { status: 503 },
    } as unknown as AxiosError;

    await expect(axios.onResponseRejected(error)).rejects.toBe(error);

    expect(recordMock).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'DELETE',
        url: 'https://example.com/api/resource',
        status: 503,
        error: 'Server error',
        durationMs: expect.any(Number),
      }),
    );
  });

  it('should use zero duration when axios response has no matching request start', () => {
    const recordMock = vi.fn();
    const { axios } = createHttpTelemetryInstrumentation({ logsPath, onRecord: recordMock });
    const config = { method: 'get', url: '/orphan' } as InternalAxiosRequestConfig;

    axios.onResponseFulfilled({ status: 204, config } as AxiosResponse);

    expect(recordMock).toHaveBeenCalledWith(expect.objectContaining({ durationMs: 0 }));
  });

  it('should stringify non-Error values in openapi-fetch onError', () => {
    const recordMock = vi.fn();
    const { openApiFetch } = createHttpTelemetryInstrumentation({ logsPath, onRecord: recordMock });
    const request = new Request('https://example.com/api');

    expect(() => openApiFetch.onError({ request, error: 'timeout' })).toThrow();

    expect(recordMock).toHaveBeenCalledWith(expect.objectContaining({ error: 'timeout', status: 0 }));
  });

  it('should delegate recording to recordHttpTelemetry when onRecord is omitted', () => {
    const recordSpy = partialSpyOn(recordHttpTelemetryModule, 'recordHttpTelemetry');
    const { axios } = createHttpTelemetryInstrumentation({ logsPath });
    const config = { method: 'get', url: '/via-default' } as InternalAxiosRequestConfig;

    axios.onRequestFulfilled(config);
    axios.onResponseFulfilled({ status: 200, config } as AxiosResponse);

    expect(recordSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        logsPath,
        url: '/via-default',
        status: 200,
      }),
    );
  });
});
