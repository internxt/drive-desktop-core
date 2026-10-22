import { Result } from '../../../../../../common/result';
import type { MailBridgeClientCredentials } from '../../../constants';
import type { MailBridgeCredentialsStore } from '../../../mail-bridge.types';
import { encryptMailBridgeCredentials } from './encrypt-mail-bridge-credentials';

/**
 * Encrypts local mail-client credentials before passing them to the host store.
 * Never writes plaintext credentials or writes when encryption fails.
 *
 * @param credentials - The local mail-client username and password to persist.
 * @param store - Storage scoped to the current account by the host desktop app.
 * @returns The encrypted payload, or an encryption or storage error.
 */
export function storeCredentials(credentials: MailBridgeClientCredentials, store: MailBridgeCredentialsStore): Result<string, Error> {
  const { data: encryptedCredentials, error: encryptionError } = encryptMailBridgeCredentials(credentials);
  if (encryptionError) {
    return Result.err(encryptionError);
  }

  try {
    store.write(encryptedCredentials);
    return Result.ok(encryptedCredentials);
  } catch (error) {
    return Result.err(new Error('Could not store Mail Bridge credentials', { cause: error }));
  }
}
