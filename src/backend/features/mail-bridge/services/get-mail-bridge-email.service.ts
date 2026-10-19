import { Result } from '../../../../common/result';
import { logger } from '../../../core/logger/logger';
import { MailBridgeSessionPreparationError } from '../errors/mail-bridge-session-preparation.error';
import type { MailBridgeClientConfig } from '../mail-bridge.types';
import { createMailClient } from './mail-client.service';
import { retrieveMailAccountKeys } from './session.service';

/**
 * Retrieves the Mail account address using host-supplied client settings.
 * Preserves account-key errors, including the missing-mailbox code, so callers
 * can distinguish mailbox setup from network or client-configuration failures.
 *
 * @param clientConfig - The API endpoint, desktop identity, and current access token.
 * @returns The account address, or a typed Mail session preparation error.
 */
export async function getMailBridgeEmail(clientConfig: MailBridgeClientConfig): Promise<Result<string, MailBridgeSessionPreparationError>> {
  try {
    const mailClient = createMailClient(clientConfig);
    const result = await retrieveMailAccountKeys(mailClient.getMailAccountKeys);
    if (result.error) {
      logger.error({ msg: 'Mail Bridge email could not be retrieved', error: result.error });
      return Result.err(result.error);
    }
    return Result.ok(result.data.address);
  } catch (error) {
    const mailBridgeError = new MailBridgeSessionPreparationError(
      'mail-key-fetch-failed',
      error instanceof Error ? error.message : 'Could not retrieve Mail account email',
    );
    logger.error({ msg: 'Mail Bridge email retrieval failed', error: mailBridgeError });
    return Result.err(mailBridgeError);
  }
}
