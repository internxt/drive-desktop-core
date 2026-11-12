import { describe, expect, it } from 'vitest';

import { extractHttpRequestDetails } from './extract-http-request-details';

describe('extract-http-request-details', () => {
  it('should parse string URL with optional method in second argument', () => {
    const details = extractHttpRequestDetails(['http://example.com/items', { method: 'put' }], false);

    expect(details).toStrictEqual({
      method: 'PUT',
      url: 'http://example.com/items',
      socketPath: undefined,
    });
  });

  it('should parse URL instance as first argument', () => {
    const target = new URL('https://example.com:8443/api?v=1');
    const details = extractHttpRequestDetails([target, { method: 'patch' }], true);

    expect(details.method).toBe('PATCH');
    expect(details.url).toBe(target.href);
  });

  it('should build HTTP URL from options object including non-default port', () => {
    const details = extractHttpRequestDetails(
      [
        {
          hostname: 'api.example.com',
          port: 8080,
          path: '/v1/health',
          method: 'post',
        },
      ],
      false,
    );

    expect(details).toStrictEqual({
      method: 'POST',
      url: 'http://api.example.com:8080/v1/health',
      socketPath: undefined,
    });
  });

  it('should build HTTPS URL using host fallback and default port', () => {
    const details = extractHttpRequestDetails(
      [
        {
          host: 'secure.example.com',
          path: '/data',
        },
      ],
      true,
    );

    expect(details).toStrictEqual({
      method: 'GET',
      url: 'https://secure.example.com/data',
      socketPath: undefined,
    });
  });

  it('should read explicit protocol from options', () => {
    const details = extractHttpRequestDetails(
      [
        {
          protocol: 'http:',
          hostname: 'legacy.example.com',
          path: '/',
        },
      ],
      true,
    );

    expect(details.url).toBe('http://legacy.example.com/');
  });

  it('should expose socketPath for unix socket requests', () => {
    const details = extractHttpRequestDetails(
      [
        {
          socketPath: '/var/run/app.sock',
          path: '/ping',
          method: 'get',
        },
      ],
      false,
    );

    expect(details.socketPath).toBe('/var/run/app.sock');
    expect(details.url).toBe('http://localhost/ping');
  });

  it('should return GET with empty url for unsupported first argument', () => {
    const details = extractHttpRequestDetails([42], false);

    expect(details).toStrictEqual({ method: 'GET', url: '' });
  });

  it('should omit port segment when port is invalid or matches default', () => {
    const invalidPort = extractHttpRequestDetails([{ hostname: 'host', port: 'bad', path: '/' }], false);
    const defaultHttpPort = extractHttpRequestDetails([{ hostname: 'host', port: 80, path: '/' }], false);

    expect(invalidPort.url).toMatch(/\/\/host\/$/);
    expect(defaultHttpPort.url).toMatch(/\/\/host\/$/);
  });
});
