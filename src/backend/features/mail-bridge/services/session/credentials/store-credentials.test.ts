/* eslint-disable sonarjs/no-hardcoded-passwords */
import { safeStorage } from 'electron';

import { Result } from '../../../../../../common/result';
import type { MailBridgeCredentialsStore } from '../../../mail-bridge.types';
import { storeCredentials } from './store-credentials';

vi.mock('electron', () => ({ safeStorage: { isEncryptionAvailable: vi.fn(), encryptString: vi.fn() } }));

describe('storeCredentials', () => {
  const credentials = { username: 'user@inxt.me', password: 'test-client-password' };
  const encrypted = Buffer.from('encrypted payload');
  let store: MailBridgeCredentialsStore;

  beforeEach(() => {
    store = { read: vi.fn(), write: vi.fn() };
    vi.mocked(safeStorage.isEncryptionAvailable).mockReturnValue(true);
    vi.mocked(safeStorage.encryptString).mockReset().mockReturnValue(encrypted);
  });

  it('writes only the encrypted base64 payload', () => {
    expect(storeCredentials(credentials, store)).toEqual(Result.ok(encrypted.toString('base64')));
    expect(safeStorage.encryptString).toHaveBeenCalledWith(JSON.stringify(credentials));
    expect(store.write).toHaveBeenCalledExactlyOnceWith(encrypted.toString('base64'));
    expect(store.read).not.toHaveBeenCalled();
  });

  it('does not write when secure storage is unavailable', () => {
    vi.mocked(safeStorage.isEncryptionAvailable).mockReturnValue(false);

    expect(storeCredentials(credentials, store)).toEqual(Result.err(new Error('Secure credential storage is unavailable')));
    expect(store.write).not.toHaveBeenCalled();
  });

  it('does not write when encryption fails', () => {
    const cause = new Error('Keyring locked');
    vi.mocked(safeStorage.encryptString).mockImplementation(() => {
      throw cause;
    });

    expect(storeCredentials(credentials, store).error?.cause).toBe(cause);
    expect(store.write).not.toHaveBeenCalled();
  });

  it('returns a storage error with its original cause when the write fails', () => {
    const cause = new Error('Disk full');
    vi.mocked(store.write).mockImplementation(() => {
      throw cause;
    });

    const result = storeCredentials(credentials, store);

    expect(result.error?.message).toBe('Could not store Mail Bridge credentials');
    expect(result.error?.cause).toBe(cause);
    expect(result.data).toBeUndefined();
  });
});
