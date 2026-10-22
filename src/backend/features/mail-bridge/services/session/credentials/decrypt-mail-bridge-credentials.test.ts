/* eslint-disable sonarjs/no-hardcoded-passwords */
import { safeStorage } from 'electron';

import { Result } from '../../../../../../common/result';
import { decryptMailBridgeCredentials } from './decrypt-mail-bridge-credentials';

vi.mock('electron', () => ({
  safeStorage: {
    isEncryptionAvailable: vi.fn(),
    decryptString: vi.fn(),
  },
}));

describe('decryptMailBridgeCredentials', () => {
  const encryptedBytes = Buffer.from([0, 255, 128, 1, 42]);
  const encryptedCredentials = encryptedBytes.toString('base64');

  beforeEach(() => {
    vi.mocked(safeStorage.isEncryptionAvailable).mockReturnValue(true);
    vi.mocked(safeStorage.decryptString).mockReset();
  });

  it('decodes the base64 payload before decrypting and parsing credentials', () => {
    const credentials = { username: 'user@inxt.me', password: 'local-client-secret' };
    vi.mocked(safeStorage.decryptString).mockReturnValue(JSON.stringify(credentials));

    const result = decryptMailBridgeCredentials(encryptedCredentials);

    expect(safeStorage.decryptString).toHaveBeenCalledWith(encryptedBytes);
    expect(result).toEqual(Result.ok(credentials));
  });

  it('leaves credential structure validation to the mapper', () => {
    vi.mocked(safeStorage.decryptString).mockReturnValue('null');

    expect(decryptMailBridgeCredentials(encryptedCredentials)).toEqual(Result.ok(null));
  });

  it('returns an error without decrypting when secure storage is unavailable', () => {
    vi.mocked(safeStorage.isEncryptionAvailable).mockReturnValue(false);

    const result = decryptMailBridgeCredentials(encryptedCredentials);

    expect(result).toEqual(Result.err(new Error('Secure credential storage is unavailable')));
    expect(safeStorage.decryptString).not.toHaveBeenCalled();
  });

  it('preserves the cause when decryption fails', () => {
    const cause = new Error('Keyring is locked');
    vi.mocked(safeStorage.decryptString).mockImplementation(() => {
      throw cause;
    });

    const result = decryptMailBridgeCredentials(encryptedCredentials);

    expect(Result.isError(result)).toBe(true);
    expect(result.error?.message).toBe('Could not decrypt Mail Bridge credentials');
    expect(result.error?.cause).toBe(cause);
    expect(result.data).toBeUndefined();
  });

  it('returns an error when decrypted data is not valid JSON', () => {
    vi.mocked(safeStorage.decryptString).mockReturnValue('invalid-json');

    const result = decryptMailBridgeCredentials(encryptedCredentials);

    expect(Result.isError(result)).toBe(true);
    expect(result.error?.message).toBe('Could not decrypt Mail Bridge credentials');
    expect(result.error?.cause).toBeInstanceOf(SyntaxError);
    expect(result.data).toBeUndefined();
  });
});
