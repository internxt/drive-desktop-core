import { isUpdatedAtEpoch } from './is-updated-at-epoch';

describe('is-updated-at-epoch', () => {
  it('returns true for the epoch', () => {
    expect(isUpdatedAtEpoch('1970-01-01T00:00:00.000Z')).toBe(true);
  });

  it('returns false for a checkpoint after the epoch', () => {
    expect(isUpdatedAtEpoch('2026-09-22T10:00:00.000Z')).toBe(false);
  });
});
