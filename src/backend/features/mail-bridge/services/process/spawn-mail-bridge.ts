import { spawn, type ChildProcess } from 'node:child_process';

import { Result } from '../../../../../common/result';
import type { SpawnMailBridgeProps } from '../../mail-bridge.types';

/**
 * Launches the resolved bridge executable with its private endpoint, account state
 * directory, and host-supplied environment. Keeps stdin and stdout disconnected
 * and pipes stderr so startup can capture diagnostics.
 *
 * @param props - Resolved process settings; the host validates its Mail environment.
 * @returns The child process, or an error thrown while launching it. Asynchronous
 * process errors are handled by the shared startup and lifecycle services.
 */
export function spawnMailBridge({
  executablePath,
  workingDirectory,
  endpoint,
  stateDirectory,
  environment,
}: SpawnMailBridgeProps): Result<ChildProcess, Error> {
  try {
    return Result.ok(
      spawn(executablePath, ['--control-endpoint', endpoint, '--state-dir', stateDirectory], {
        cwd: workingDirectory,
        env: environment,
        windowsHide: true,
        stdio: ['ignore', 'ignore', 'pipe'],
      }),
    );
  } catch (error) {
    return Result.err(error instanceof Error ? error : new Error('Could not start Mail Bridge'));
  }
}
