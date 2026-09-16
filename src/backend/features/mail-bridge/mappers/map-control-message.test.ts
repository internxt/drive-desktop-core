import { mapControlMessage } from './map-control-message';

describe('map-control-message', () => {
  it('maps a ready message after validating its shape', () => {
    expect(mapControlMessage({ type: 'ready', ready: { imap_address: '127.0.0.1:1143', smtp_address: '127.0.0.1:2025', starttls: true } })).toEqual({
      data: { type: 'ready', ready: { imap_address: '127.0.0.1:1143', smtp_address: '127.0.0.1:2025', starttls: true } },
      error: undefined,
    });
  });

  it('rejects an incomplete ready message', () => {
    expect(mapControlMessage({ type: 'ready', ready: { imap_address: '127.0.0.1:1143' } }).error).toEqual(
      new Error('Mail Bridge sent an invalid control message'),
    );
  });

  it('rejects an unknown message type', () => {
    expect(mapControlMessage({ type: 'unknown' }).error).toEqual(new Error('Mail Bridge sent an invalid control message'));
  });
});
