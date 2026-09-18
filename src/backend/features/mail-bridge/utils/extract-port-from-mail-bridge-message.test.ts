import { MAX_ALLOWED_PORT } from '../constants';
import { extractPortFromMailBridgeMessage } from './extract-port-from-mail-bridge-message';

describe('extract-port-from-mail-bridge-message', () => {
  it('should extract a valid TCP port', () => {
    expect(extractPortFromMailBridgeMessage({ address: '127.0.0.1:1143' })).toBe(1143);
  });

  it.each(['127.0.0.1:0', `127.0.0.1:${MAX_ALLOWED_PORT + 1}`, '127.0.0.1:not-a-port'])(
    'should reject an invalid TCP port: %s',
    (address) => {
      expect(extractPortFromMailBridgeMessage({ address })).toBeUndefined();
    },
  );
});
