import { Result } from '@/common/result';
import { calls, partialSpyOn } from '@/tests/vitest/utils.helper.test';

import { FILE_SIZE_LIMIT_UPGRADE_POLL_INTERVAL_MS, FILE_SIZE_LIMIT_UPGRADE_WATCH_DURATION_MS } from '../constants';
import * as revalidateFileSizeLimitModule from './revalidate-file-size-limit';
import { stopWatchingFileSizeLimit, watchFileSizeLimitAfterUpgrade } from './watch-file-size-limit-after-upgrade';

describe('watch-file-size-limit-after-upgrade', () => {
  const revalidateFileSizeLimitMock = partialSpyOn(revalidateFileSizeLimitModule, 'revalidateFileSizeLimit');
  const getStoredLimit = vi.fn<() => number>();
  const saveLimit = vi.fn();
  const saveLastRevalidatedAt = vi.fn();
  const fetchLimit = vi.fn<() => Promise<Result<number, Error>>>();
  const props = { getStoredLimit, saveLimit, saveLastRevalidatedAt, fetchLimit };

  beforeEach(() => {
    vi.useFakeTimers();
    getStoredLimit.mockReturnValue(10);
    revalidateFileSizeLimitMock.mockResolvedValue(Result.ok(10));
  });

  afterEach(() => {
    stopWatchingFileSizeLimit();
    vi.useRealTimers();
  });

  it('should ask the backend for the limit once per interval', async () => {
    // When
    watchFileSizeLimitAfterUpgrade(props);
    await vi.advanceTimersByTimeAsync(FILE_SIZE_LIMIT_UPGRADE_POLL_INTERVAL_MS * 2);
    // Then
    const revalidateProps = { saveLimit, saveLastRevalidatedAt, fetchLimit };
    calls(revalidateFileSizeLimitMock).toStrictEqual([revalidateProps, revalidateProps]);
  });

  it('should stop once the limit returned by the backend changes', async () => {
    // Given
    revalidateFileSizeLimitMock.mockResolvedValue(Result.ok(20));
    // When
    watchFileSizeLimitAfterUpgrade(props);
    await vi.advanceTimersByTimeAsync(FILE_SIZE_LIMIT_UPGRADE_POLL_INTERVAL_MS * 3);
    // Then
    calls(revalidateFileSizeLimitMock).toHaveLength(1);
  });

  it('should keep asking if the backend cannot be reached', async () => {
    // Given
    revalidateFileSizeLimitMock.mockResolvedValue(Result.err(new Error('Network error')));
    // When
    watchFileSizeLimitAfterUpgrade(props);
    await vi.advanceTimersByTimeAsync(FILE_SIZE_LIMIT_UPGRADE_POLL_INTERVAL_MS * 3);
    // Then
    calls(revalidateFileSizeLimitMock).toHaveLength(3);
  });

  it('should stop once the watch duration has passed', async () => {
    // When
    watchFileSizeLimitAfterUpgrade(props);
    await vi.advanceTimersByTimeAsync(FILE_SIZE_LIMIT_UPGRADE_WATCH_DURATION_MS * 2);
    // Then
    calls(revalidateFileSizeLimitMock).toHaveLength(FILE_SIZE_LIMIT_UPGRADE_WATCH_DURATION_MS / FILE_SIZE_LIMIT_UPGRADE_POLL_INTERVAL_MS);
  });

  it('should extend the watch instead of starting another one if it is already running', async () => {
    // When
    watchFileSizeLimitAfterUpgrade(props);
    await vi.advanceTimersByTimeAsync(FILE_SIZE_LIMIT_UPGRADE_WATCH_DURATION_MS / 2);
    watchFileSizeLimitAfterUpgrade(props);
    await vi.advanceTimersByTimeAsync(FILE_SIZE_LIMIT_UPGRADE_WATCH_DURATION_MS * 2);
    // Then
    const expectedCalls = Math.floor((FILE_SIZE_LIMIT_UPGRADE_WATCH_DURATION_MS * 1.5) / FILE_SIZE_LIMIT_UPGRADE_POLL_INTERVAL_MS);
    calls(revalidateFileSizeLimitMock).toHaveLength(expectedCalls);
    calls(getStoredLimit).toHaveLength(1);
  });

  it('should not ask the backend once it has been stopped', async () => {
    // When
    watchFileSizeLimitAfterUpgrade(props);
    stopWatchingFileSizeLimit();
    await vi.advanceTimersByTimeAsync(FILE_SIZE_LIMIT_UPGRADE_POLL_INTERVAL_MS * 3);
    // Then
    calls(revalidateFileSizeLimitMock).toHaveLength(0);
  });
});
