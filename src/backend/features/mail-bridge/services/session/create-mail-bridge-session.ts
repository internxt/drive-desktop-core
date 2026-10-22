import { Result } from '../../../../../common/result';
import { logger } from '../../../../core/logger/logger';
import type { MailBridgeSession } from '../../constants';
import type { CreateMailBridgeSessionProps } from '../../mail-bridge.types';
import { getOrCreateMailBridgeCredentials } from './credentials/get-or-create-mail-bridge-credentials';
import { createMailClient } from './mail-client.service';
import { prepareMailBridgeSession } from './session.service';

/**
 * Retrieves or creates local mail-client credentials, fetches the account keys,
 * and unlocks the Mail encryption keystore using the supplied mnemonic.
 * Uses one client configuration snapshot for API calls and the bridge token.
 *
 * @param props - Account details, authentication, client settings, and account-scoped storage.
 * @returns The secret bridge session, or a credential, API, or key-unlock error.
 * Preparation error codes are preserved. The returned session must not be logged.
 */
export async function createMailBridgeSession({
  accountId,
  email,
  mnemonic,
  clientConfig,
  credentialsStore,
}: CreateMailBridgeSessionProps): Promise<Result<MailBridgeSession, Error>> {
  logger.debug({ tag: 'MAIL-BRIDGE', msg: 'Preparing Mail Bridge session' });
  const { data: credentials, error } = getOrCreateMailBridgeCredentials(email, credentialsStore);
  if (error) {
    logger.error({ tag: 'MAIL-BRIDGE', msg: 'Mail Bridge credentials could not be prepared', error });
    return Result.err(error);
  }

  try {
    const mailClient = createMailClient(clientConfig);
    const result = await prepareMailBridgeSession({
      accountId,
      token: clientConfig.token,
      mnemonic,
      mailClient: credentials,
      getMailAccountKeys: mailClient.getMailAccountKeys,
    });
    if (result.error) {
      logger.error({ tag: 'MAIL-BRIDGE', msg: 'Mail Bridge session preparation failed', error: result.error });
      return Result.err(result.error);
    }
    logger.debug({ tag: 'MAIL-BRIDGE', msg: 'Mail Bridge session prepared' });
    return Result.ok(result.data);
  } catch (error) {
    const sessionError = error instanceof Error ? error : new Error(String(error));
    logger.error({ tag: 'MAIL-BRIDGE', msg: 'Mail Bridge session preparation threw', error: sessionError });
    return Result.err(sessionError);
  }
}
