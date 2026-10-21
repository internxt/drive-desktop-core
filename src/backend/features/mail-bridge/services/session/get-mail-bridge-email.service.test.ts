import { Result } from '../../../../../common/result';
import type { MailBridgeClientConfig } from '../../mail-bridge.types';
import { getMailBridgeEmail } from './get-mail-bridge-email.service';
import { MailBridgeSessionPreparationError } from './mail-bridge-session-preparation.error';
import { createMailClient } from './mail-client.service';
import { retrieveMailAccountKeys } from './session.service';

vi.mock('./mail-client.service', () => ({ createMailClient: vi.fn() }));
vi.mock('./session.service', () => ({ retrieveMailAccountKeys: vi.fn() }));

describe('getMailBridgeEmail', () => {
  const config: MailBridgeClientConfig = {
    gatewayUrl: 'https://gateway.example.test/drive',
    clientName: 'desktop-test',
    clientVersion: '1.0.0',
    desktopHeader: 'test-header',
    token: 'test-token',
  };
  const getMailAccountKeys = vi.fn<() => Promise<unknown>>();

  beforeEach(() => {
    vi.mocked(createMailClient).mockReset().mockReturnValue({ getMailAccountKeys });
    vi.mocked(retrieveMailAccountKeys)
      .mockReset()
      .mockResolvedValue(
        Result.ok({
          address: 'user@inxt.me',
          publicKey: 'public-key',
          encryptionPrivateKey: 'encrypted-private-key',
        }),
      );
  });

  it('returns the account address using host-provided configuration', async () => {
    expect(await getMailBridgeEmail(config)).toEqual(Result.ok('user@inxt.me'));
    expect(createMailClient).toHaveBeenCalledWith(config);
    expect(retrieveMailAccountKeys).toHaveBeenCalledWith(getMailAccountKeys);
  });

  it('preserves the missing-mailbox error and its code', async () => {
    const error = new MailBridgeSessionPreparationError('mail-not-setup', 'Mailbox not configured');
    vi.mocked(retrieveMailAccountKeys).mockResolvedValue(Result.err(error));
    expect((await getMailBridgeEmail(config)).error).toBe(error);
  });

  it('reports client-construction failures as key-fetch errors', async () => {
    vi.mocked(createMailClient).mockImplementation(() => {
      throw new Error('Mail service unavailable');
    });

    expect((await getMailBridgeEmail(config)).error).toMatchObject({
      code: 'mail-key-fetch-failed',
      message: 'Mail service unavailable',
    });
  });

  it('normalizes unknown retrieval failures into a typed error', async () => {
    vi.mocked(retrieveMailAccountKeys).mockRejectedValue('unknown failure');
    expect((await getMailBridgeEmail(config)).error).toMatchObject({
      code: 'mail-key-fetch-failed',
      message: 'Could not retrieve Mail account email',
    });
  });
});
