import type { ChildProcess } from 'node:child_process';
import type { Socket } from 'node:net';

import { Result } from '../../../../../common/result';
import type { MailBridgeReadyMessage } from '../../constants';
import { createStartupTimeout } from '../../utils/create-startup-timeout';
import { waitForReadyMessage } from '../communication.service';
import { waitForMailBridgeExit } from './wait-for-mail-bridge-exit';

type WaitForMailBridgeReadyProps = {
  socket: Socket;
  child: ChildProcess;
  getStartupError: () => string | undefined;
};

/** Waits for readiness while preserving buffered messages for the running bridge. */
export async function waitForMailBridgeReady({
  socket,
  child,
  getStartupError,
}: WaitForMailBridgeReadyProps): Promise<Result<{ ready: MailBridgeReadyMessage; remaining: Buffer }, Error>> {
  const cancellation = new AbortController();
  const timeout = createStartupTimeout();
  if (Result.isError(timeout)) return Result.err(timeout.error);
  const startupTimeout = timeout.data;

  try {
    const result: Result<{ ready: MailBridgeReadyMessage; remaining: Buffer }, Error> = await Promise.race([
      waitForReadyMessage({ socket }),
      waitForMailBridgeExit({
        child,
        getStartupError,
        message: 'Mail Bridge exited before becoming ready',
        signal: cancellation.signal,
      }),
      startupTimeout.result,
    ]);
    return Result.isError(result) ? Result.err(result.error) : Result.ok(result.data);
  } catch (error) {
    return Result.err(error instanceof Error ? error : new Error('Mail Bridge failed during startup', { cause: error }));
  } finally {
    cancellation.abort();
    startupTimeout.cancel();
  }
}
