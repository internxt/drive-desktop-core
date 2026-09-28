import type { MailAccountKeys } from '../constants';
import { isRecord } from './is-record';

export function mapMailAccountKeys(value: unknown): { data: MailAccountKeys; error: undefined } | { data: undefined; error: Error } {
  if (!isMailAccountKeys(value)) return { data: undefined, error: new Error('Mail account keys have an invalid format') };
  return { data: value, error: undefined };
}

function isMailAccountKeys(value: unknown): value is MailAccountKeys {
  if (!isRecord(value)) return false;
  return typeof value.address === 'string' && typeof value.publicKey === 'string' && typeof value.encryptionPrivateKey === 'string';
}
