import { Stats } from 'fs';
import { promises as fs } from 'fs';
import { wasAccessedWithinLastHour } from './was-accessed-within-last-hour';
import { deepMocked } from '@/tests/vitest/utils.helper.test';

vi.mock('fs');

describe('wasAccessedWithinLastHour', () => {
  const statMock = deepMocked(fs.stat);
  const mockFilePath = '/test/file.txt';

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-09-19T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return true when file was accessed within last hour', async () => {
    const recentTime = new Date('2025-09-19T11:30:00Z'); // 30 minutes ago
    const mockStat = {
      atime: recentTime,
      mtime: new Date('2025-09-19T10:00:00Z'),
    } as Stats;
    statMock.mockResolvedValue(mockStat);

    const result = await wasAccessedWithinLastHour(mockFilePath);

    expect(result).toBe(true);
  });

  it('should return false when file was accessed more than an hour ago', async () => {
    const oldTime = new Date('2025-09-19T10:30:00Z'); // 1.5 hours ago from 12:00:00Z
    const mockStat = {
      atime: oldTime,
      mtime: oldTime,
    } as Stats;
    statMock.mockResolvedValue(mockStat);

    const result = await wasAccessedWithinLastHour(mockFilePath);

    expect(result).toBe(false);
  });

  it('should return true when file access check fails (safety first)', async () => {
    statMock.mockRejectedValue(new Error('Permission denied'));

    const result = await wasAccessedWithinLastHour(mockFilePath);

    expect(result).toBe(true);
  });
});
