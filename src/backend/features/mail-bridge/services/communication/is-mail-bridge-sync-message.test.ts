import type { ControlMessage } from '../../constants';
import { isMailBridgeSyncMessage } from './is-mail-bridge-sync-message';

describe('isMailBridgeSyncMessage', () => {
  const syncMessages: ControlMessage[] = [
    { type: 'sync_started', started: { total: 2 } },
    { type: 'sync_progress', progress: { downloaded: 1, total: 2, percent: 50 } },
    { type: 'sync_finished', finished: { downloaded: 2, total: 2 } },
    { type: 'sync_finished', finished: { downloaded: 1, total: 2, code: 'sync-failed' } },
  ];

  it.each(syncMessages)('should recognize a $type message as sync activity', (message) => {
    expect(isMailBridgeSyncMessage(message)).toBe(true);
  });

  const otherMessages: ControlMessage[] = [
    { type: 'ready', ready: { imap_address: '127.0.0.1:1143', smtp_address: '127.0.0.1:1025', starttls: false } },
    { type: 'error', error: { code: 'session-expired' } },
  ];

  it.each(otherMessages)('should reject a $type message as sync activity', (message) => {
    expect(isMailBridgeSyncMessage(message)).toBe(false);
  });
});
