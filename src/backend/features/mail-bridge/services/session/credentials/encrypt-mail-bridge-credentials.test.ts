/* eslint-disable sonarjs/no-hardcoded-passwords */
import { safeStorage } from 'electron';

import { Result } from '../../../../../../common/result';
import { encryptMailBridgeCredentials } from './encrypt-mail-bridge-credentials';

vi.mock('electron', () => ({
  safeStorage: {
    isEncryptionAvailable: vi.fn(),
    encryptString: vi.fn(),
  },
}));

describe('encryptMailBridgeCredentials', () => {
  const credentials = { username: 'user@inxt.me', password: 'local-client-secret' };

  beforeEach(() => {
    vi.mocked(safeStorage.isEncryptionAvailable).mockReturnValue(true);
    vi.mocked(safeStorage.encryptString).mockReset();
  });

  it('encrypts the credentials JSON and returns the encrypted bytes as base64', () => {
    const encrypted = Buffer.from([0, 255, 128, 1, 42]);
    vi.mocked(safeStorage.encryptString).mockReturnValue(encrypted);

    const result = encryptMailBridgeCredentials(credentials);

    expect(safeStorage.encryptString).toHaveBeenCalledWith(JSON.stringify(credentials));
    expect(result).toEqual(Result.ok(encrypted.toString('base64')));
  });

  it('returns an error without encrypting when secure storage is unavailable', () => {
    vi.mocked(safeStorage.isEncryptionAvailable).mockReturnValue(false);

    const result = encryptMailBridgeCredentials(credentials);

    expect(result).toEqual(Result.err(new Error('Secure credential storage is unavailable')));
    expect(safeStorage.encryptString).not.toHaveBeenCalled();
  });

  it('preserves the cause when encryption fails', () => {
    const cause = new Error('Keyring is locked');
    vi.mocked(safeStorage.encryptString).mockImplementation(() => {
      throw cause;
    });

    const result = encryptMailBridgeCredentials(credentials);

    expect(Result.isError(result)).toBe(true);
    expect(result.error?.message).toBe('Could not encrypt Mail Bridge credentials');
    expect(result.error?.cause).toBe(cause);
    expect(result.data).toBeUndefined();
  });
});
