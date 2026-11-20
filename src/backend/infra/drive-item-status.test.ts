import { describe, expect, it } from 'vitest';

import { DriveItemStatus, isDriveItemStatus, toDriveItemStatus } from './drive-item-status';

describe('drive-item-status', () => {
  describe('isDriveItemStatus', () => {
    it('returns true for known API status values', () => {
      expect(isDriveItemStatus('EXISTS')).toBe(true);
      expect(isDriveItemStatus('TRASHED')).toBe(true);
      expect(isDriveItemStatus('DELETED')).toBe(true);
    });

    it('returns false for unknown status values', () => {
      expect(isDriveItemStatus('REMOVED')).toBe(false);
      expect(isDriveItemStatus('')).toBe(false);
    });
  });

  describe('toDriveItemStatus', () => {
    it('maps API status values to DriveItemStatus', () => {
      expect(toDriveItemStatus('EXISTS')).toBe(DriveItemStatus.EXISTS);
      expect(toDriveItemStatus('TRASHED')).toBe(DriveItemStatus.TRASHED);
      expect(toDriveItemStatus('DELETED')).toBe(DriveItemStatus.DELETED);
    });
  });
});
