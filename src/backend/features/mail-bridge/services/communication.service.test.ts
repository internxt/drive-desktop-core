/* eslint-disable sonarjs/no-hardcoded-passwords */
import { Socket } from 'node:net';

import type { ControlMessage } from '../constants';
import { createConnectionSettings, createControlFrame, listenToControlMessages, readControlMessage, waitForReadyMessage } from './communication.service';

describe('communication.service', () => {
  it('frames and reads a ready message without changing the remaining data', () => {
    const message = { type: 'ready', ready: { imap_address: '127.0.0.1:1143', smtp_address: '127.0.0.1:2025', starttls: true } };
    const frame = createControlFrame(message);
    if (frame.error) throw frame.error;

    expect(readControlMessage(Buffer.concat([frame.data, Buffer.from('next')]))).toEqual({
      data: { message, remaining: Buffer.from('next') },
      error: undefined,
    });
  });

  it('retains a partial frame and decodes following frames in order', () => {
    const socket = new Socket();
    const ready = createControlFrame({
      type: 'ready',
      ready: { imap_address: '127.0.0.1:1143', smtp_address: '127.0.0.1:2025', starttls: true },
    });
    const progress = createControlFrame({ type: 'sync_progress', progress: { downloaded: 1, total: 2, percent: 50 } });
    if (ready.error) throw ready.error;
    if (progress.error) throw progress.error;
    const messages: ControlMessage[] = [];
    const errors: Error[] = [];
    const stop = listenToControlMessages({
      socket,
      onMessage: (message) => messages.push(message),
      onError: (error) => errors.push(error),
      onClose: () => undefined,
    });

    socket.emit('data', ready.data.subarray(0, 3));
    socket.emit('data', Buffer.concat([ready.data.subarray(3), progress.data]));

    expect(messages).toEqual([
      { type: 'ready', ready: { imap_address: '127.0.0.1:1143', smtp_address: '127.0.0.1:2025', starttls: true } },
      { type: 'sync_progress', progress: { downloaded: 1, total: 2, percent: 50 } },
    ]);
    expect(errors).toEqual([]);
    stop();
  });

  it('should hand control frames received after ready to the persistent listener', async () => {
    const socket = new Socket();
    const ready = createControlFrame({
      type: 'ready',
      ready: { imap_address: '127.0.0.1:1143', smtp_address: '127.0.0.1:2025', starttls: true },
    });
    const syncStarted = createControlFrame({ type: 'sync_started', started: { total: 2 } });
    if (ready.error) throw ready.error;
    if (syncStarted.error) throw syncStarted.error;

    const readyResult = waitForReadyMessage({ socket });
    socket.emit('data', Buffer.concat([ready.data, syncStarted.data]));
    const { data, error } = await readyResult;
    if (error) throw error;

    const messages: ControlMessage[] = [];
    const stop = listenToControlMessages({
      socket,
      initialBuffer: data.remaining,
      onMessage: (message) => messages.push(message),
      onError: (error) => {
        throw error;
      },
      onClose: () => undefined,
    });

    expect(data.ready).toEqual({ imap_address: '127.0.0.1:1143', smtp_address: '127.0.0.1:2025', starttls: true });
    expect(messages).toEqual([{ type: 'sync_started', started: { total: 2 } }]);
    stop();
  });

  it('maps listener addresses and credentials into local client settings', () => {
    expect(
      createConnectionSettings({
        ready: { imap_address: '127.0.0.1:1143', smtp_address: '127.0.0.1:2025', starttls: true },
        session: {
          account_id: 'account',
          addresses: ['user@example.com'],
          backend_session: { token: 'token', encryption_private_key: 'key' },
          mail_client: { username: 'user@example.com', password: 'password' },
        },
      }),
    ).toEqual({
      data: {
        hostname: '127.0.0.1',
        imapPort: 1143,
        smtpPort: 2025,
        username: 'user@example.com',
        password: 'password',
        imapSecurity: 'STARTTLS',
        smtpSecurity: 'None',
      },
      error: undefined,
    });
  });

  it('uses the daemon listener hostname when both services bind to the same loopback address', () => {
    expect(
      createConnectionSettings({
        ready: { imap_address: '127.0.0.2:1143', smtp_address: '127.0.0.2:2025', starttls: false },
        session: {
          account_id: 'account',
          addresses: ['user@example.com'],
          backend_session: { token: 'token', encryption_private_key: 'key' },
          mail_client: { username: 'user@example.com', password: 'password' },
        },
      }),
    ).toMatchObject({ data: { hostname: '127.0.0.2' }, error: undefined });
  });

  it('rejects listener addresses with different hostnames', () => {
    expect(
      createConnectionSettings({
        ready: { imap_address: '127.0.0.1:1143', smtp_address: '127.0.0.2:2025', starttls: true },
        session: {
          account_id: 'account',
          addresses: ['user@example.com'],
          backend_session: { token: 'token', encryption_private_key: 'key' },
          mail_client: { username: 'user@example.com', password: 'password' },
        },
      }),
    ).toEqual({ data: undefined, error: expect.any(Error) });
  });
});
