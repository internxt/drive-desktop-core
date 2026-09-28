import { mapControlMessage } from './map-control-message';

describe('map-control-message', () => {
  it('maps a ready message after validating its shape', () => {
    expect(
      mapControlMessage({ type: 'ready', ready: { imap_address: '127.0.0.1:1143', smtp_address: '127.0.0.1:2025', starttls: true } }),
    ).toEqual({
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

  it('maps validated sync progress messages', () => {
    expect(mapControlMessage({ type: 'sync_progress', progress: { downloaded: 3, total: 10, percent: 30 } })).toEqual({
      data: { type: 'sync_progress', progress: { downloaded: 3, total: 10, percent: 30 } },
      error: undefined,
    });
  });

  it('rejects sync progress that exceeds its total', () => {
    expect(mapControlMessage({ type: 'sync_progress', progress: { downloaded: 11, total: 10, percent: 100 } }).error).toEqual(
      new Error('Mail Bridge sent an invalid control message'),
    );
  });
});
