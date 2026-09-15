import { createConnectionSettings, createControlFrame, readControlMessage } from './communication.service';

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
});
