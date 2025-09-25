import { Stats } from 'fs';

import { wasAccessedWithinLastHour } from './was-accessed-within-last-hour';

describe('wasAccessedWithinLastHour', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-09-19T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return true when file was accessed within last hour', () => {
    const recentTime = new Date('2025-09-19T11:30:00Z');
    const mockStat = {
      atime: recentTime,
      mtime: new Date('2025-09-19T10:00:00Z'),
    } as Stats;

    const result = wasAccessedWithinLastHour({ fileStats: mockStat });

    expect(result).toBe(true);
  });

  it('should return false when file was accessed more than an hour ago', () => {
    const oldTime = new Date('2025-09-19T10:30:00Z');
    const mockStat = {
      atime: oldTime,
      mtime: oldTime,
    } as Stats;

    const result = wasAccessedWithinLastHour({ fileStats: mockStat });

    expect(result).toBe(false);
  });
});
