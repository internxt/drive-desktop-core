import { MAX_ALLOWED_PORT } from '../constants';

/**
 * Extracts and validates the TCP port from a Mail Bridge listener address.
 */
export function extractPortFromMailBridgeMessage({ address }: { address: string }): number | undefined {
  const port = Number(address.slice(address.lastIndexOf(':') + 1));
  return Number.isInteger(port) && port > 0 && port <= MAX_ALLOWED_PORT ? port : undefined;
}
