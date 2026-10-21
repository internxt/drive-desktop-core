/* eslint-disable sonarjs/no-hardcoded-passwords */
import { Result } from '../../../../../common/result';
import type { MailBridgeSession } from '../../constants';
import type { CreateMailBridgeSessionProps } from '../../mail-bridge.types';
import { createMailBridgeSession } from './create-mail-bridge-session';
import { getOrCreateMailBridgeCredentials } from './credentials/get-or-create-mail-bridge-credentials';
import { MailBridgeSessionPreparationError } from './mail-bridge-session-preparation.error';
import { createMailClient } from './mail-client.service';
import { prepareMailBridgeSession } from './session.service';

vi.mock('./credentials/get-or-create-mail-bridge-credentials', () => ({ getOrCreateMailBridgeCredentials: vi.fn() }));
vi.mock('./mail-client.service', () => ({ createMailClient: vi.fn() }));
vi.mock('./session.service', () => ({ prepareMailBridgeSession: vi.fn() }));

describe('createMailBridgeSession', () => {
  const credentials = { username: 'user@inxt.me', password: 'test-client-password' };
  const session: MailBridgeSession = {
    account_id: 'account-id',
    addresses: ['user@inxt.me'],
    mail_client: credentials,
    backend_session: { token: 'test-token', encryption_private_key: 'private-key', encryption_public_key: 'public-key' },
  };
  let props: CreateMailBridgeSessionProps;
  const getMailAccountKeys = vi.fn<() => Promise<unknown>>();

  beforeEach(() => {
    props = {
      accountId: 'account-id',
      email: 'account@example.test',
      mnemonic: 'test-mnemonic',
      clientConfig: {
        gatewayUrl: 'https://gateway.example.test/drive',
        clientName: 'desktop-test',
        clientVersion: '1.0.0',
        desktopHeader: 'test-header',
        token: 'test-token',
      },
      credentialsStore: { read: vi.fn(), write: vi.fn() },
    };
    vi.mocked(getOrCreateMailBridgeCredentials).mockReset().mockReturnValue(Result.ok(credentials));
    vi.mocked(createMailClient).mockReset().mockReturnValue({ getMailAccountKeys });
    vi.mocked(prepareMailBridgeSession).mockReset().mockResolvedValue(Result.ok(session));
  });

  it('uses host settings, credential storage, and one token snapshot to prepare the session', async () => {
    expect(await createMailBridgeSession(props)).toEqual(Result.ok(session));
    expect(getOrCreateMailBridgeCredentials).toHaveBeenCalledWith(props.email, props.credentialsStore);
    expect(createMailClient).toHaveBeenCalledWith(props.clientConfig);
    expect(prepareMailBridgeSession).toHaveBeenCalledWith({
      accountId: props.accountId,
      token: props.clientConfig.token,
      mnemonic: props.mnemonic,
      mailClient: credentials,
      getMailAccountKeys,
    });
  });

  it('returns credential errors before creating an API client', async () => {
    const error = new Error('Storage unavailable');
    vi.mocked(getOrCreateMailBridgeCredentials).mockReturnValue(Result.err(error));
    expect(await createMailBridgeSession(props)).toEqual(Result.err(error));
    expect(createMailClient).not.toHaveBeenCalled();
    expect(prepareMailBridgeSession).not.toHaveBeenCalled();
  });

  it('preserves actionable preparation errors and their codes', async () => {
    const error = new MailBridgeSessionPreparationError('mail-not-setup', 'Mailbox not configured');
    vi.mocked(prepareMailBridgeSession).mockResolvedValue(Result.err(error));
    expect((await createMailBridgeSession(props)).error).toBe(error);
  });

  it('returns client construction errors', async () => {
    const error = new Error('Invalid gateway URL');
    vi.mocked(createMailClient).mockImplementation(() => {
      throw error;
    });
    expect((await createMailBridgeSession(props)).error).toBe(error);
    expect(prepareMailBridgeSession).not.toHaveBeenCalled();
  });

  it('preserves errors thrown while preparing the session', async () => {
    const error = new Error('Mail service unavailable');
    vi.mocked(prepareMailBridgeSession).mockRejectedValue(error);
    expect((await createMailBridgeSession(props)).error).toBe(error);
  });

  it('normalizes unknown preparation failures into Error results', async () => {
    vi.mocked(prepareMailBridgeSession).mockRejectedValue('Mail API unavailable');
    expect(await createMailBridgeSession(props)).toEqual(Result.err(new Error('Mail API unavailable')));
  });
});
