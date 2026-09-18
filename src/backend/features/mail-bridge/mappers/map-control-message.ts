import type { ControlMessage } from '../constants';
import { isRecord } from './is-record';

type MessageResult = { data: ControlMessage; error: undefined } | { data: undefined; error: Error }

export function mapControlMessage(value: unknown): MessageResult {
  if (!isRecord(value) || typeof value.type !== 'string') return { data: undefined, error: new Error('Mail Bridge sent an invalid control message') };
  if (value.type === 'ready') return mapReadyMessage(value);
  if (value.type === 'error') return mapErrorMessage(value);
  if (value.type === 'sync_started') return mapSyncStartedMessage(value);
  if (value.type === 'sync_progress') return mapSyncProgressMessage(value);
  if (value.type === 'sync_finished') return mapSyncFinishedMessage(value);
  return { data: undefined, error: new Error('Mail Bridge sent an invalid control message') };
}

function mapReadyMessage(value: Record<string, unknown>): MessageResult {
  if (!isRecord(value.ready)) return { data: undefined, error: new Error('Mail Bridge sent an invalid control message') };
  const { imap_address: imapAddress, smtp_address: smtpAddress, starttls } = value.ready;
  if (typeof imapAddress !== 'string' || typeof smtpAddress !== 'string' || typeof starttls !== 'boolean') {
    return { data: undefined, error: new Error('Mail Bridge sent an invalid control message') };
  }
  return { data: { type: 'ready', ready: { imap_address: imapAddress, smtp_address: smtpAddress, starttls } }, error: undefined };
}

function mapErrorMessage(value: Record<string, unknown>): MessageResult {
  if (!isRecord(value.error) || typeof value.error.code !== 'string') return { data: undefined, error: new Error('Mail Bridge sent an invalid control message') };
  return { data: { type: 'error', error: { code: value.error.code } }, error: undefined };
}

function mapSyncStartedMessage(value: Record<string, unknown>): MessageResult {
  if (!isRecord(value.started) || !isNonNegativeInteger(value.started.total)) return invalidControlMessage();
  return { data: { type: 'sync_started', started: { total: value.started.total } }, error: undefined };
}

function mapSyncProgressMessage(value: Record<string, unknown>): MessageResult {
  const progress = validateSyncProgress(value.progress);
  if (progress.error) return progress;
  return { data: { type: 'sync_progress', progress: progress.data }, error: undefined };
}

function validateSyncProgress(value: unknown) {
  if (!isRecord(value)) return invalidControlMessage();
  const { downloaded, total, percent } = value;
  if (!isNonNegativeInteger(downloaded) || !isNonNegativeInteger(total) || !isPercentage(percent) || downloaded > total) {
    return invalidControlMessage();
  }
  return { data: { downloaded, total, percent }, error: undefined };
}

function mapSyncFinishedMessage(value: Record<string, unknown>): MessageResult {
  const finished = validateSyncFinished(value.finished);
  if (finished.error) return finished;
  return { data: { type: 'sync_finished', finished: finished.data }, error: undefined };
}

function validateSyncFinished(value: unknown) {
  if (!isRecord(value)) return invalidControlMessage();
  const { downloaded, total, code } = value;
  if (!isNonNegativeInteger(downloaded) || !isNonNegativeInteger(total) || downloaded > total || (code !== undefined && typeof code !== 'string')) {
    return invalidControlMessage();
  }
  return { data: code === undefined ? { downloaded, total } : { downloaded, total, code }, error: undefined };
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function isPercentage(value: unknown): value is number {
  return isNonNegativeInteger(value) && value <= 100;
}

function invalidControlMessage(): { data: undefined; error: Error } {
  return { data: undefined, error: new Error('Mail Bridge sent an invalid control message') };
}
