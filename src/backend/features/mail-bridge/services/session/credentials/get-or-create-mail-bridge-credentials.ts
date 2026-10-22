import { Result } from '../../../../../../common/result';
import type { MailBridgeClientCredentials } from '../../../constants';
import type { MailBridgeCredentialsStore } from '../../../mail-bridge.types';
import { generateRandomPassword } from './generate-random-password';
import { retrieveMailBridgeCredentials } from './retrieve-mail-bridge-credentials';
import { storeCredentials } from './store-credentials';

/**
 * Reuses the account saved mail-client credentials or creates and securely stores a new password when none exist.
 * Retrieval errors are returned without replacing existing credentials, so a locked keyring or invalid payload cannot reset them.
 *
 * @param email - Account email used as the initial username for new credentials.
 * @param store - Storage scoped to this account by the host desktop app.
 * @returns Saved or newly persisted credentials, or a retrieval or storage error.
 */
export function getOrCreateMailBridgeCredentials(
  email: string,
  store: MailBridgeCredentialsStore,
): Result<MailBridgeClientCredentials, Error> {
  const { data: stored, error } = retrieveMailBridgeCredentials(store);
  if (error) return Result.err(error);
  if (stored) return Result.ok(stored);

  const credentials: MailBridgeClientCredentials = { username: email, password: generateRandomPassword() };
  const saved = storeCredentials(credentials, store);
  if (saved.error) return Result.err(saved.error);
  return Result.ok(credentials);
}
