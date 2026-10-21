/* eslint-disable sonarjs/no-hardcoded-passwords */
import { safeStorage } from 'electron';

import { Result } from '../../../common/result';
import { getOrCreateMailBridgeCredentials } from './get-or-create-mail-bridge-credentials';
import type { MailBridgeCredentialsStore } from './mail-bridge.types';

vi.mock('electron', () => ({
  safeStorage: { isEncryptionAvailable: vi.fn(), encryptString: vi.fn(), decryptString: vi.fn() },
}));

describe('getOrCreateMailBridgeCredentials', () => {
  const email = 'user@inxt.me';
  const encrypted = Buffer.from('encrypted payload');
  let store: MailBridgeCredentialsStore;

  beforeEach(() => {
    store = { read: vi.fn().mockReturnValue(Result.ok(undefined)), write: vi.fn() };
    vi.mocked(safeStorage.isEncryptionAvailable).mockReturnValue(true);
    vi.mocked(safeStorage.encryptString).mockReset().mockReturnValue(encrypted);
    vi.mocked(safeStorage.decryptString).mockReset();
  });

  it('creates a random password and persists it securely before returning credentials', () => {
    const result = getOrCreateMailBridgeCredentials(email, store);

    expect(result.error).toBeUndefined();
    expect(result.data?.username).toBe(email);
    expect(result.data?.password).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(safeStorage.encryptString).toHaveBeenCalledWith(JSON.stringify(result.data));
    expect(store.write).toHaveBeenCalledWith(encrypted.toString('base64'));
  });

  it('reuses existing credentials without generating or storing a new password', () => {
    const credentials = { username: 'existing@inxt.me', password: 'existing-client-password' };
    vi.mocked(store.read).mockReturnValue(Result.ok(encrypted.toString('base64')));
    vi.mocked(safeStorage.decryptString).mockReturnValue(JSON.stringify(credentials));

    expect(getOrCreateMailBridgeCredentials(email, store)).toEqual(Result.ok(credentials));
    expect(safeStorage.encryptString).not.toHaveBeenCalled();
    expect(store.write).not.toHaveBeenCalled();
  });

  it('does not replace credentials after a storage read error', () => {
    const error = new Error('Storage unavailable');
    vi.mocked(store.read).mockReturnValue(Result.err(error));

    expect(getOrCreateMailBridgeCredentials(email, store)).toEqual(Result.err(error));
    expect(safeStorage.encryptString).not.toHaveBeenCalled();
    expect(store.write).not.toHaveBeenCalled();
  });

  it('does not replace malformed stored credentials', () => {
    vi.mocked(store.read).mockReturnValue(Result.ok(encrypted.toString('base64')));
    vi.mocked(safeStorage.decryptString).mockReturnValue('null');

    expect(getOrCreateMailBridgeCredentials(email, store)).toEqual(Result.err(new Error('Stored Mail Bridge credentials are invalid')));
    expect(store.write).not.toHaveBeenCalled();
  });

  it('does not return new credentials when they cannot be persisted', () => {
    const cause = new Error('Disk full');
    vi.mocked(store.write).mockImplementation(() => {
      throw cause;
    });

    const result = getOrCreateMailBridgeCredentials(email, store);

    expect(result.error?.cause).toBe(cause);
    expect(result.data).toBeUndefined();
  });

  it('does not store new credentials when secure storage is unavailable', () => {
    vi.mocked(safeStorage.isEncryptionAvailable).mockReturnValue(false);

    expect(getOrCreateMailBridgeCredentials(email, store)).toEqual(Result.err(new Error('Secure credential storage is unavailable')));
    expect(store.write).not.toHaveBeenCalled();
  });
});
