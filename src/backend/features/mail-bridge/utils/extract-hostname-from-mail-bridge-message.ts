/**
 * Extracts the hostname from a Mail Bridge listener address.
 */
export function extractHostnameFromMailBridgeMessage({ address }: { address: string }): string | undefined {
  const separatorIndex = address.lastIndexOf(':');
  if (separatorIndex <= 0) return undefined;
  const hostname = address.slice(0, separatorIndex).replace(/^\[|\]$/g, '');
  return hostname || undefined;
}
