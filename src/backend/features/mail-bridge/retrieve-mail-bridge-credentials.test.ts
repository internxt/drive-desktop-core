/* eslint-disable sonarjs/no-hardcoded-passwords */
import { safeStorage } from 'electron';

import { Result } from '../../../common/result';
import type { MailBridgeCredentialsStore } from './mail-bridge.types';
import { retrieveMailBridgeCredentials } from './retrieve-mail-bridge-credentials';

vi.mock('electron', () => ({ safeStorage: { isEncryptionAvailable: vi.fn(), decryptString: vi.fn() } }));

describe('retrieveMailBridgeCredentials', () => {
  const encrypted = Buffer.from('encrypted payload').toString('base64');
  const credentials = { username: 'user@inxt.me', password: 'test-client-password' };
  let store: MailBridgeCredentialsStore;

  beforeEach(() => {
    store = { read: vi.fn().mockReturnValue(Result.ok(encrypted)), write: vi.fn() };
    vi.mocked(safeStorage.isEncryptionAvailable).mockReturnValue(true);
    vi.mocked(safeStorage.decryptString).mockReset().mockReturnValue(JSON.stringify(credentials));
  });

  it('reads, decrypts, and validates stored credentials', () => {
    expect(retrieveMailBridgeCredentials(store)).toEqual(Result.ok(credentials));
    expect(store.read).toHaveBeenCalledTimes(1);
    expect(safeStorage.decryptString).toHaveBeenCalledWith(Buffer.from(encrypted, 'base64'));
    expect(store.write).not.toHaveBeenCalled();
  });

  it.each([undefined, ''])('returns no credentials for an empty stored value (%s)', (value) => {
    vi.mocked(store.read).mockReturnValue(Result.ok(value));

    expect(retrieveMailBridgeCredentials(store)).toEqual(Result.ok(undefined));
    expect(safeStorage.decryptString).not.toHaveBeenCalled();
  });

  it('preserves storage errors without decrypting or writing', () => {
    const error = new Error('Could not read config');
    vi.mocked(store.read).mockReturnValue(Result.err(error));

    expect(retrieveMailBridgeCredentials(store)).toEqual(Result.err(error));
    expect(safeStorage.decryptString).not.toHaveBeenCalled();
    expect(store.write).not.toHaveBeenCalled();
  });

  it('returns an error when secure storage is unavailable', () => {
    vi.mocked(safeStorage.isEncryptionAvailable).mockReturnValue(false);

    expect(retrieveMailBridgeCredentials(store)).toEqual(Result.err(new Error('Secure credential storage is unavailable')));
    expect(safeStorage.decryptString).not.toHaveBeenCalled();
  });

  it('preserves the cause of a decryption failure', () => {
    const cause = new Error('Keyring locked');
    vi.mocked(safeStorage.decryptString).mockImplementation(() => {
      throw cause;
    });

    const result = retrieveMailBridgeCredentials(store);

    expect(result.error?.message).toBe('Could not decrypt Mail Bridge credentials');
    expect(result.error?.cause).toBe(cause);
  });

  it('rejects invalid JSON and leaves storage untouched', () => {
    vi.mocked(safeStorage.decryptString).mockReturnValue('invalid-json');

    const result = retrieveMailBridgeCredentials(store);

    expect(result.error?.cause).toBeInstanceOf(SyntaxError);
    expect(store.write).not.toHaveBeenCalled();
  });

  it('rejects decrypted data that is not a valid credential structure', () => {
    vi.mocked(safeStorage.decryptString).mockReturnValue(JSON.stringify({ username: 'user@inxt.me' }));

    expect(retrieveMailBridgeCredentials(store)).toEqual(Result.err(new Error('Stored Mail Bridge credentials are invalid')));
  });
});
