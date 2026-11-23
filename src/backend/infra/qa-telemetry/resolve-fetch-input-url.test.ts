import { describe, expect, it } from 'vitest';

import { resolveFetchInputUrl } from './resolve-fetch-input-url';

describe('resolve-fetch-input-url', () => {
  it('should return string input as-is', () => {
    expect(resolveFetchInputUrl('https://example.com/a')).toBe('https://example.com/a');
  });

  it('should return href when input is a URL instance', () => {
    const target = new URL('https://example.com/b');
    expect(resolveFetchInputUrl(target)).toBe('https://example.com/b');
  });

  it('should return request url when input is a Request', () => {
    const request = new Request('https://example.com/c', { method: 'HEAD' });
    expect(resolveFetchInputUrl(request)).toBe('https://example.com/c');
  });
});
