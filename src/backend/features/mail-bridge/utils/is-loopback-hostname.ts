import { isIP } from 'node:net';

export function isLoopbackHostname(hostname: string): boolean {
  if (hostname === '::1') return true;
  return isIP(hostname) === 4 && hostname.startsWith('127.');
}