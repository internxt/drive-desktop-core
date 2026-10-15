import type { ControlMessage } from '../constants';
import { createUnexpectedControlMessageError } from './create-unexpected-control-message-error';

describe('createUnexpectedControlMessageError', () => {
  it('preserves the error code supplied by the bridge', () => {
    const error = createUnexpectedControlMessageError({ type: 'error', error: { code: 'session-expired' } });

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Mail Bridge stopped: session-expired');
  });

  const unexpectedMessages: ControlMessage[] = [
    { type: 'ready', ready: { imap_address: '127.0.0.1:1143', smtp_address: '127.0.0.1:1025', starttls: false } },
    { type: 'sync_started', started: { total: 2 } },
    { type: 'sync_progress', progress: { downloaded: 1, total: 2, percent: 50 } },
    { type: 'sync_finished', finished: { downloaded: 2, total: 2 } },
  ];

  it.each(unexpectedMessages)('reports an unexpected $type message', (message) => {
    expect(createUnexpectedControlMessageError(message).message).toBe('Mail Bridge sent an unexpected control message');
  });
});
