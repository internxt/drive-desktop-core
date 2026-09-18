import { MailApi } from '@internxt/sdk/dist/mail';

/**
 * Creates the authenticated Mail API operation required to obtain the account encryption keystore.
 */
export function createMailClient({
  gatewayUrl,
  clientName,
  clientVersion,
  desktopHeader,
  token,
}: {
  gatewayUrl: string;
  clientName: string;
  clientVersion: string;
  desktopHeader: string;
  token: string;
}): { getMailAccountKeys: () => Promise<unknown> } {
  const client = MailApi.client(new URL('/mail/', gatewayUrl).toString(), { clientName, clientVersion, desktopHeader }, { token });
  return { getMailAccountKeys: async () => await client.getMailAccountKeys() };
}
