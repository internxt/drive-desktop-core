import { Result } from '../../../../common/result';
import { startupTimeoutMs } from '../constants';
import { createStartupTimeout } from './create-startup-timeout';

describe('createStartupTimeout', () => {
  beforeEach(() => vi.useFakeTimers());

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('should return a timeout that reports failure only when the startup deadline expires', async () => {
    const created = createStartupTimeout();
    if (Result.isError(created)) throw created.error;

    const settled = vi.fn();
    void created.data.result.then(settled);
    await vi.advanceTimersByTimeAsync(startupTimeoutMs - 1);
    expect(settled).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    const expired = await created.data.result;
    expect(Result.isError(expired)).toBe(true);
    expect(expired.error).toEqual(new Error('Mail Bridge startup timed out'));
    expect(settled).toHaveBeenCalledTimes(1);
  });

  it('should cancel the timer without settling the timeout promise', async () => {
    const created = createStartupTimeout();
    if (Result.isError(created)) throw created.error;

    const settled = vi.fn();
    void created.data.result.then(settled);
    created.data.cancel();
    created.data.cancel();
    await vi.advanceTimersByTimeAsync(startupTimeoutMs);

    expect(settled).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('should return the original error when timer creation fails', () => {
    const error = new Error('Timer unavailable');
    vi.spyOn(globalThis, 'setTimeout').mockImplementation(() => {
      throw error;
    });

    const result = createStartupTimeout();

    expect(Result.isError(result)).toBe(true);
    expect(result.error).toBe(error);
  });

  it('should wrap non-Error timer creation failures and preserves the cause', () => {
    vi.spyOn(globalThis, 'setTimeout').mockImplementation(() => {
      // Exercise normalization of non-Error failures from the timer API.
      // eslint-disable-next-line no-throw-literal, @typescript-eslint/only-throw-error
      throw 'timer unavailable';
    });

    const result = createStartupTimeout();

    expect(Result.isError(result)).toBe(true);
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error?.message).toBe('Could not create Mail Bridge startup timeout');
    expect(result.error?.cause).toBe('timer unavailable');
  });
});
