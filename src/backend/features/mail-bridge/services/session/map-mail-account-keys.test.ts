import { mapMailAccountKeys } from './map-mail-account-keys';

describe('map-mail-account-keys', () => {
  it('maps a complete Mail account keys response', () => {
    expect(
      mapMailAccountKeys({
        address: 'user@internxt.com',
        publicKey: 'public-key',
        encryptionPrivateKey: 'encrypted-private-key',
      }),
    ).toEqual({
      data: {
        address: 'user@internxt.com',
        publicKey: 'public-key',
        encryptionPrivateKey: 'encrypted-private-key',
      },
      error: undefined,
    });
  });

  it('rejects an incomplete Mail account keys response', () => {
    expect(mapMailAccountKeys({ address: 'user@internxt.com', publicKey: 'public-key' })).toEqual({
      data: undefined,
      error: expect.any(Error),
    });
  });
});
