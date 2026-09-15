import type { ControlMessage } from '../constants';
import { isRecord } from './is-record';

export function mapControlMessage(value: unknown): { data: ControlMessage; error: undefined } | { data: undefined; error: Error } {
  if (!isRecord(value) || typeof value.type !== 'string') return { data: undefined, error: new Error('Mail Bridge sent an invalid control message') };
  if (value.type === 'ready') return mapReadyMessage(value);
  if (value.type === 'error') return mapErrorMessage(value);
  return { data: undefined, error: new Error('Mail Bridge sent an invalid control message') };
}

function mapReadyMessage(value: Record<string, unknown>): { data: ControlMessage; error: undefined } | { data: undefined; error: Error } {
  if (!isRecord(value.ready)) return { data: undefined, error: new Error('Mail Bridge sent an invalid control message') };
  const { imap_address: imapAddress, smtp_address: smtpAddress, starttls } = value.ready;
  if (typeof imapAddress !== 'string' || typeof smtpAddress !== 'string' || typeof starttls !== 'boolean') {
    return { data: undefined, error: new Error('Mail Bridge sent an invalid control message') };
  }
  return { data: { type: 'ready', ready: { imap_address: imapAddress, smtp_address: smtpAddress, starttls } }, error: undefined };
}

function mapErrorMessage(value: Record<string, unknown>): { data: ControlMessage; error: undefined } | { data: undefined; error: Error } {
  if (!isRecord(value.error) || typeof value.error.code !== 'string') return { data: undefined, error: new Error('Mail Bridge sent an invalid control message') };
  return { data: { type: 'error', error: { code: value.error.code } }, error: undefined };
}
