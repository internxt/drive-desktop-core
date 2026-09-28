import { extractHostnameFromMailBridgeMessage } from './extract-hostname-from-mail-bridge-message';

describe('extract-hostname-from-mail-bridge-message', () => {
  it('should extract an IPv4 hostname', () => {
    expect(extractHostnameFromMailBridgeMessage({ address: '127.0.0.1:1143' })).toBe('127.0.0.1');
  });

  it('should extract an IPv6 hostname without brackets', () => {
    expect(extractHostnameFromMailBridgeMessage({ address: '[::1]:1143' })).toBe('::1');
  });

  it('should reject an address without a hostname and port separator', () => {
    expect(extractHostnameFromMailBridgeMessage({ address: 'localhost' })).toBeUndefined();
  });
});
