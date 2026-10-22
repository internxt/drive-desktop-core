import { Result } from '../../../../../common/result';
import { startupTimeoutMs } from '../../constants';

/**
 * Creates the cancellable timeout that limits a Mail Bridge startup phase.
 * The outer result reports timer creation errors; the inner promise reports expiry.
 */
export function createStartupTimeout(): Result<{ result: Promise<Result<never, Error>>; cancel: () => void }, Error> {
  try {
    const { promise: result, resolve } = Promise.withResolvers<Result<never, Error>>();
    const timeout = setTimeout(() => resolve(Result.err(new Error('Mail Bridge startup timed out'))), startupTimeoutMs);
    return Result.ok({ result, cancel: () => clearTimeout(timeout) });
  } catch (error) {
    return Result.err(error instanceof Error ? error : new Error('Could not create Mail Bridge startup timeout', { cause: error }));
  }
}
