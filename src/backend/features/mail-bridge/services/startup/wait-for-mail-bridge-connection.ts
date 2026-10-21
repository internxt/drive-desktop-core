import type { ChildProcess } from 'node:child_process';
import type { Server, Socket } from 'node:net';

import { Result } from '../../../../../common/result';
import { createStartupTimeout } from '../../utils/create-startup-timeout';
import { waitForControlConnection } from '../communication.service';
import { waitForMailBridgeExit } from './wait-for-mail-bridge-exit';

type WaitForMailBridgeConnectionProps = {
  server: Server;
  child: ChildProcess;
  getStartupError: () => string | undefined;
};

/** Waits for the control connection, reporting process exit or timeout as a Result. */
export async function waitForMailBridgeConnection({
  server,
  child,
  getStartupError,
}: WaitForMailBridgeConnectionProps): Promise<Result<Socket, Error>> {
  const cancellation = new AbortController();
  const timeout = createStartupTimeout();
  if (Result.isError(timeout)) return Result.err(timeout.error);
  const startupTimeout = timeout.data;

  try {
    const result: Result<Socket, Error> = await Promise.race([
      waitForControlConnection({ server }),
      waitForMailBridgeExit({
        child,
        getStartupError,
        message: 'Mail Bridge exited before connecting',
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
