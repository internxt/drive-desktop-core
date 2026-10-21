import { Result } from '@/common/result';
import { call, calls } from '@/tests/vitest/utils.helper.test';

import { FILE_SIZE_LIMIT_REVALIDATION_INTERVAL_MS } from '../constants';
import { revalidateFileSizeLimit, wasFileSizeLimitRevalidatedRecently } from './revalidate-file-size-limit';

describe('revalidate-file-size-limit', () => {
  const now = new Date('2026-10-20T10:00:00.000Z').getTime();
  const saveLimit = vi.fn();
  const saveLastRevalidatedAt = vi.fn();
  const fetchLimit = vi.fn<() => Promise<Result<number, Error>>>();

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(now);
    fetchLimit.mockResolvedValue(Result.ok(100));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('revalidateFileSizeLimit', () => {
    it('should save the limit returned by the backend and the revalidation time', async () => {
      // When
      const res = await revalidateFileSizeLimit({ saveLimit, saveLastRevalidatedAt, fetchLimit });
      // Then
      expect(res).toStrictEqual({ data: 100 });
      call(saveLimit).toStrictEqual({ limit: 100 });
      call(saveLastRevalidatedAt).toStrictEqual({ timestamp: now });
    });

    it('should not save the limit nor the revalidation time if the backend fails', async () => {
      // Given
      const error = new Error('Network error');
      fetchLimit.mockResolvedValue(Result.err(error));
      // When
      const res = await revalidateFileSizeLimit({ saveLimit, saveLastRevalidatedAt, fetchLimit });
      // Then
      expect(res).toStrictEqual({ error });
      calls(saveLimit).toHaveLength(0);
      calls(saveLastRevalidatedAt).toHaveLength(0);
    });

    it('should return an error if fetching the limit throws', async () => {
      // Given
      const error = new Error('Unexpected');
      fetchLimit.mockRejectedValue(error);
      // When
      const res = await revalidateFileSizeLimit({ saveLimit, saveLastRevalidatedAt, fetchLimit });
      // Then
      expect(res).toStrictEqual({ error });
      calls(saveLimit).toHaveLength(0);
      calls(saveLastRevalidatedAt).toHaveLength(0);
    });

    it('should share the request in progress between overlapping calls', async () => {
      // Given
      const { promise, resolve } = Promise.withResolvers<Result<number, Error>>();
      fetchLimit.mockReturnValue(promise);
      // When
      const first = revalidateFileSizeLimit({ saveLimit, saveLastRevalidatedAt, fetchLimit });
      const second = revalidateFileSizeLimit({ saveLimit, saveLastRevalidatedAt, fetchLimit });
      resolve(Result.ok(100));
      await Promise.all([first, second]);
      // Then
      expect(second).toBe(first);
      calls(fetchLimit).toHaveLength(1);
    });

    it('should request again once the previous request has finished', async () => {
      // When
      await revalidateFileSizeLimit({ saveLimit, saveLastRevalidatedAt, fetchLimit });
      await revalidateFileSizeLimit({ saveLimit, saveLastRevalidatedAt, fetchLimit });
      // Then
      calls(fetchLimit).toHaveLength(2);
    });
  });

  describe('wasFileSizeLimitRevalidatedRecently', () => {
    it('should be false if the limit was never revalidated', () => {
      // When
      const res = wasFileSizeLimitRevalidatedRecently({ getLastRevalidatedAt: () => undefined });
      // Then
      expect(res).toBe(false);
    });

    it('should be true within the revalidation interval', () => {
      // When
      const res = wasFileSizeLimitRevalidatedRecently({
        getLastRevalidatedAt: () => now - FILE_SIZE_LIMIT_REVALIDATION_INTERVAL_MS + 1,
      });
      // Then
      expect(res).toBe(true);
    });

    it('should be false once the revalidation interval has passed', () => {
      // When
      const res = wasFileSizeLimitRevalidatedRecently({ getLastRevalidatedAt: () => now - FILE_SIZE_LIMIT_REVALIDATION_INTERVAL_MS });
      // Then
      expect(res).toBe(false);
    });
  });
});
