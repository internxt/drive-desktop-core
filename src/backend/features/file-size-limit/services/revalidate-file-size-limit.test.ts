import { Result } from '@/common/result';
import { call, calls } from '@/tests/vitest/utils.helper.test';

import { FILE_SIZE_LIMIT_REVALIDATION_INTERVAL_MS } from '../constants';
import { resetFileSizeLimitRevalidation, revalidateFileSizeLimit, wasFileSizeLimitRevalidatedRecently } from './revalidate-file-size-limit';

describe('revalidate-file-size-limit', () => {
  const saveLimit = vi.fn();
  const fetchLimit = vi.fn<() => Promise<Result<number, Error>>>();

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-20T10:00:00.000Z'));
    resetFileSizeLimitRevalidation();
    fetchLimit.mockResolvedValue(Result.ok(100));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should save the limit returned by the backend and mark it as revalidated', async () => {
    // When
    const res = await revalidateFileSizeLimit({ saveLimit, fetchLimit });
    // Then
    expect(res).toStrictEqual({ data: 100 });
    call(saveLimit).toStrictEqual({ limit: 100 });
    expect(wasFileSizeLimitRevalidatedRecently()).toBe(true);
  });

  it('should not save nor mark as revalidated if the backend fails', async () => {
    // Given
    const error = new Error('Network error');
    fetchLimit.mockResolvedValue(Result.err(error));
    // When
    const res = await revalidateFileSizeLimit({ saveLimit, fetchLimit });
    // Then
    expect(res).toStrictEqual({ error });
    calls(saveLimit).toHaveLength(0);
    expect(wasFileSizeLimitRevalidatedRecently()).toBe(false);
  });

  it('should return an error if fetching the limit throws', async () => {
    // Given
    const error = new Error('Unexpected');
    fetchLimit.mockRejectedValue(error);
    // When
    const res = await revalidateFileSizeLimit({ saveLimit, fetchLimit });
    // Then
    expect(res).toStrictEqual({ error });
    calls(saveLimit).toHaveLength(0);
  });

  it('should share the request in progress between overlapping calls', async () => {
    // Given
    const { promise, resolve } = Promise.withResolvers<Result<number, Error>>();
    fetchLimit.mockReturnValue(promise);
    // When
    const first = revalidateFileSizeLimit({ saveLimit, fetchLimit });
    const second = revalidateFileSizeLimit({ saveLimit, fetchLimit });
    resolve(Result.ok(100));
    await Promise.all([first, second]);
    // Then
    expect(second).toBe(first);
    calls(fetchLimit).toHaveLength(1);
  });

  it('should request again once the previous request has finished', async () => {
    // When
    await revalidateFileSizeLimit({ saveLimit, fetchLimit });
    await revalidateFileSizeLimit({ saveLimit, fetchLimit });
    // Then
    calls(fetchLimit).toHaveLength(2);
  });

  it('should stop being recently revalidated after the revalidation interval', async () => {
    // Given
    await revalidateFileSizeLimit({ saveLimit, fetchLimit });
    // When
    vi.setSystemTime(Date.now() + FILE_SIZE_LIMIT_REVALIDATION_INTERVAL_MS);
    // Then
    expect(wasFileSizeLimitRevalidatedRecently()).toBe(false);
  });

  it('should not be recently revalidated after a reset', async () => {
    // Given
    await revalidateFileSizeLimit({ saveLimit, fetchLimit });
    // When
    resetFileSizeLimitRevalidation();
    // Then
    expect(wasFileSizeLimitRevalidatedRecently()).toBe(false);
  });
});
