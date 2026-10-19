import { spawn, type ChildProcess } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

import { Result } from '../../../../common/result';
import type { CreateMailBridgeStateDirectoryProps, SpawnMailBridgeProps } from '../mail-bridge.types';

/**
 * Creates the bridge state directory under the host app's data directory, scopedo one account.
 * Requests owner-only permissions on platforms that support them.
 *
 * @param props - The app data directory and the account ID used to isolate state.
 * @returns The directory path, or the filesystem error that prevented its creation.
 */
export async function createMailBridgeStateDirectory({
  baseDirectory,
  accountId,
}: CreateMailBridgeStateDirectoryProps): Promise<Result<string, Error>> {
  const stateDirectory = join(baseDirectory, 'mail-bridge', accountId);
  try {
    await mkdir(stateDirectory, { recursive: true, mode: 0o700 });
    return Result.ok(stateDirectory);
  } catch (error) {
    return Result.err(error instanceof Error ? error : new Error('Could not create the Mail Bridge state directory'));
  }
}

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
