import type { ChildProcess } from 'node:child_process';
import { once } from 'node:events';

import { Result } from '../../../../../common/result';
import { createBridgeExitError } from '../../utils/create-bridge-exit-error';

/** Waits for process exit, returning startup details or the original process/cancellation error. */
export async function waitForMailBridgeExit({
  child,
  getStartupError,
  message,
  signal,
}: {
  child: ChildProcess;
  getStartupError: () => string | undefined;
  message: string;
  signal: AbortSignal;
}): Promise<Result<never, Error>> {
  if (child.exitCode !== null) return Result.err(createBridgeExitError({ message, getStartupError }));

  try {
    await once(child, 'exit', { signal });
    return Result.err(createBridgeExitError({ message, getStartupError }));
  } catch (error) {
    return Result.err(error instanceof Error ? error : new Error('Mail Bridge failed during startup', { cause: error }));
  }
}
