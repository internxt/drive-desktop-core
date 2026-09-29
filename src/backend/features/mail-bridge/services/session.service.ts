import { KeystoreType, openEncryptionKeystore, uint8ArrayToBase64 } from 'internxt-crypto';

import {
  bridgeEncryptionKeyLength,
  mailNotSetupCode,
  type MailAccountKeys,
  type MailBridgeClientCredentials,
  type MailBridgeSession,
} from '../constants';
import { MailBridgeSessionPreparationError } from '../errors/mail-bridge-session-preparation.error';
import { isRecord } from '../mappers/is-record';
import { mapMailAccountKeys } from '../mappers/map-mail-account-keys';

/**
 * Retrieves Mail account keys, unlocks the encryption keystore, and creates the secret Bridge session payload.
 */
export async function prepareMailBridgeSession({
  accountId,
  token,
  mnemonic,
  mailClient,
  getMailAccountKeys,
}: {
  accountId: string;
  token: string;
  mnemonic: string;
  mailClient: MailBridgeClientCredentials;
  getMailAccountKeys: () => Promise<unknown>;
}): Promise<{ data: MailBridgeSession; error: undefined } | { data: undefined; error: MailBridgeSessionPreparationError }> {
  const { data, error } = await retrieveMailAccountKeys(getMailAccountKeys);
  if (error) return { error, data: undefined };

  const encryptionPrivateKey = await openMailEncryptionKeystore({ keys: data, mnemonic });
  if (encryptionPrivateKey.error) return encryptionPrivateKey;

  return {
    data: {
      account_id: accountId,
      addresses: [data.address],
      backend_session: { token, encryption_private_key: encryptionPrivateKey.data },
      mail_client: mailClient,
    },
    error: undefined,
  };
}

/**
 * Fetches and validates the Mail account keys, preserving actionable remote failure details.
 */
export async function retrieveMailAccountKeys(getMailAccountKeys: () => Promise<unknown>) {
  try {
    const result = await getMailAccountKeys();
    const { data, error } = mapMailAccountKeys(result);
    if (error) return { data: undefined, error: new MailBridgeSessionPreparationError('mail-key-fetch-failed', error.message) };
    return { data, error: undefined };
  } catch (error) {
    const details = getMailKeyRequestErrorDetails(error);
    if (isMailNotSetupError(error)) {
      return {
        data: undefined,
        error: new MailBridgeSessionPreparationError('mail-not-setup', 'Mail account has not been set up', details),
      };
    }
    return {
      data: undefined,
      error: new MailBridgeSessionPreparationError('mail-key-fetch-failed', 'Could not retrieve Mail account keys', details),
    };
  }
}

/**
 * Unlocks the encrypted Mail private key and encodes the Bridge-compatible session credential.
 */
async function openMailEncryptionKeystore({ keys, mnemonic }: { keys: MailAccountKeys; mnemonic: string }) {
  try {
    const opened = await openEncryptionKeystore(
      {
        userEmail: keys.address,
        type: KeystoreType.ENCRYPTION,
        publicKey: keys.publicKey,
        privateKeyEncrypted: keys.encryptionPrivateKey,
      },
      mnemonic,
    );
    if (opened.secretKey.byteLength !== bridgeEncryptionKeyLength) {
      return {
        data: undefined,
        error: new MailBridgeSessionPreparationError('mail-key-unlock-failed', 'Mail encryption key has an invalid length'),
      };
    }
    return { data: uint8ArrayToBase64(opened.secretKey), error: undefined };
  } catch {
    return {
      data: undefined,
      error: new MailBridgeSessionPreparationError('mail-key-unlock-failed', 'Could not unlock Mail encryption key'),
    };
  }
}

/**
 * Identifies the Mail API response used when the signed-in account has no Mail account yet.
 */
function isMailNotSetupError(error: unknown): boolean {
  return getMailKeyRequestErrorDetails(error).remoteCode === mailNotSetupCode;
}

/**
 * Extracts the status and remote error code from an unknown Mail API failure.
 */
function getMailKeyRequestErrorDetails(error: unknown): { status: number | undefined; remoteCode: string | undefined } {
  if (!isRecord(error)) return { status: undefined, remoteCode: undefined };
  const data = isRecord(error.data) ? error.data : undefined;
  const statusFromData = typeof data?.statusCode === 'number' ? data.statusCode : undefined;
  const status = typeof error.status === 'number' ? error.status : statusFromData;
  const remoteCodeFromData = typeof data?.code === 'string' ? data.code : undefined;
  const remoteCode = typeof error.code === 'string' ? error.code : remoteCodeFromData;
  return { status, remoteCode };
}
