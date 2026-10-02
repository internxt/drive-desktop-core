import { getInitialSyncUpdatedAt } from './get-initial-sync-updated-at';

describe('get-initial-sync-updated-at', () => {
  it('returns the epoch when there is no checkpoint', () => {
    expect(getInitialSyncUpdatedAt()).toBe('1970-01-01T00:00:00.000Z');
  });

  it('returns the checkpoint as an ISO date', () => {
    const from = new Date('2026-09-22T10:00:00.000Z');

    expect(getInitialSyncUpdatedAt(from)).toBe(from.toISOString());
  });
});
