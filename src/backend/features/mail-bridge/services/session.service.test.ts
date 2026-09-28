/* eslint-disable sonarjs/no-hardcoded-passwords */
import { openEncryptionKeystore } from 'internxt-crypto';

import { prepareMailBridgeSession } from './session.service';

vi.mock('internxt-crypto', async (importOriginal) => {
  const original = await importOriginal<typeof import('internxt-crypto')>();
  return { ...original, openEncryptionKeystore: vi.fn() };
});

const mailAccountKeys = {
  address: 'user@internxt.com',
  publicKey: 'public-key',
  encryptionPrivateKey: 'encrypted-private-key',
};

describe('session.service', () => {
  beforeEach(() => {
    vi.mocked(openEncryptionKeystore).mockReset();
  });

  it('opens the Mail keystore and encodes the 32-byte key for the Bridge', async () => {
    vi.mocked(openEncryptionKeystore).mockResolvedValue({ publicKey: new Uint8Array(), secretKey: new Uint8Array(32).fill(1) });

    await expect(
      prepareMailBridgeSession({
        accountId: 'account-id',
        token: 'token',
        mnemonic: 'mnemonic',
        mailClient: { username: 'user@internxt.com', password: 'password' },
        getMailAccountKeys: () => Promise.resolve(mailAccountKeys),
      }),
    ).resolves.toEqual({
      data: {
        account_id: 'account-id',
        addresses: ['user@internxt.com'],
        backend_session: { token: 'token', encryption_private_key: Buffer.alloc(32, 1).toString('base64') },
        mail_client: { username: 'user@internxt.com', password: 'password' },
      },
      error: undefined,
    });

    expect(openEncryptionKeystore).toHaveBeenCalledWith(
      {
        userEmail: 'user@internxt.com',
        type: 'Encryption',
        publicKey: 'public-key',
        privateKeyEncrypted: 'encrypted-private-key',
      },
      'mnemonic',
    );
  });

  it('returns mail-not-setup when the Mail key request reports that account state', async () => {
    const result = await prepareMailBridgeSession({
      accountId: 'account-id',
      token: 'token',
      mnemonic: 'mnemonic',
      mailClient: { username: 'user@internxt.com', password: 'password' },
      getMailAccountKeys: () =>
        Promise.reject(Object.assign(new Error('Mail account is not set up'), { data: { code: 'MAIL_NOT_SETUP' } })),
    });

    expect(result.data).toBeUndefined();
    expect(result.error).toMatchObject({ code: 'mail-not-setup' });
  });

  it('preserves a failed Mail key request status and remote code without its response body', async () => {
    const result = await prepareMailBridgeSession({
      accountId: 'account-id',
      token: 'token',
      mnemonic: 'mnemonic',
      mailClient: { username: 'user@internxt.com', password: 'password' },
      getMailAccountKeys: () =>
        Promise.reject(
          Object.assign(new Error('Mail account key request is unauthorized'), {
            status: 401,
            data: { code: 'UNAUTHORIZED', message: 'Token <REDACTED>' },
          }),
        ),
    });

    expect(result.data).toBeUndefined();
    expect(result.error).toMatchObject({ code: 'mail-key-fetch-failed', status: 401, remoteCode: 'UNAUTHORIZED' });
  });

  it('rejects an unlocked key that is not a 32-byte Bridge seed', async () => {
    vi.mocked(openEncryptionKeystore).mockResolvedValue({ publicKey: new Uint8Array(), secretKey: new Uint8Array(31) });

    const result = await prepareMailBridgeSession({
      accountId: 'account-id',
      token: 'token',
      mnemonic: 'mnemonic',
      mailClient: { username: 'user@internxt.com', password: 'password' },
      getMailAccountKeys: () => Promise.resolve(mailAccountKeys),
    });

    expect(result.data).toBeUndefined();
    expect(result.error).toMatchObject({ code: 'mail-key-unlock-failed' });
  });
});
