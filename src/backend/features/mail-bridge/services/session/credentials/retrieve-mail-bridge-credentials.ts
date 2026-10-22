import { Result } from '../../../../../../common/result';
import type { MailBridgeClientCredentials } from '../../../constants';
import type { MailBridgeCredentialsStore } from '../../../mail-bridge.types';
import { decryptMailBridgeCredentials } from './decrypt-mail-bridge-credentials';
import { mapStoredMailBridgeCredentials } from './map-stored-mail-bridge-credentials';

/**
 * Reads the account encrypted credentials through the host store,
 * decrypts the JSON payload, and validates the username and password before returning them.
 *
 * @param store - Storage scoped to the current account by the host desktop app.
 * @returns Validated credentials, undefined when none are stored, or a storage,
 * decryption, or validation error. Missing credentials allow the caller to create new ones.
 */
export function retrieveMailBridgeCredentials(store: MailBridgeCredentialsStore): Result<MailBridgeClientCredentials | undefined, Error> {
  const { data: encryptedCredentials, error: storeError } = store.read();
  if (storeError) {
    return Result.err(storeError);
  }
  if (!encryptedCredentials) {
    return Result.ok(undefined);
  }

  const { data: credentials, error: decryptError } = decryptMailBridgeCredentials(encryptedCredentials);
  if (decryptError) {
    return Result.err(decryptError);
  }
  return mapStoredMailBridgeCredentials(credentials);
}
