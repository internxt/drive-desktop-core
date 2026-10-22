import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

import { Result } from '../../../../../common/result';
import type { CreateMailBridgeStateDirectoryProps } from '../../mail-bridge.types';

/**
 * Creates the bridge state directory under the host app's data directory, scoped to one account.
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
