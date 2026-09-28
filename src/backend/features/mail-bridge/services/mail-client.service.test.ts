import { MailApi } from '@internxt/sdk/dist/mail';

import { createMailClient } from './mail-client.service';

vi.mock('@internxt/sdk/dist/mail', () => ({ MailApi: { client: vi.fn() } }));

describe('mail-client.service', () => {
  it('uses the Mail API path below the gateway URL', () => {
    vi.mocked(MailApi.client).mockReturnValue({ getMailAccountKeys: vi.fn() } as never);

    createMailClient({
      gatewayUrl: 'https://gateway.internxt.com/drive',
      clientName: 'drive-desktop-windows',
      clientVersion: '1.0.0',
      desktopHeader: 'desktop-header',
      token: 'token',
    });

    expect(MailApi.client).toHaveBeenCalledWith(
      'https://gateway.internxt.com/mail/',
      { clientName: 'drive-desktop-windows', clientVersion: '1.0.0', desktopHeader: 'desktop-header' },
      { token: 'token' },
    );
  });
});
