import { MailApi } from '@internxt/sdk/dist/mail';

import type { MailBridgeClientConfig } from '../../mail-bridge.types';

/**
 * Creates the authenticated Mail API operation required to obtain the account encryption keystore.
 */
export function createMailClient({ gatewayUrl, clientName, clientVersion, desktopHeader, token }: MailBridgeClientConfig): {
  getMailAccountKeys: () => Promise<unknown>;
} {
  const client = MailApi.client(new URL('/mail/', gatewayUrl).toString(), { clientName, clientVersion, desktopHeader }, { token });
  return { getMailAccountKeys: async () => await client.getMailAccountKeys() };
}
