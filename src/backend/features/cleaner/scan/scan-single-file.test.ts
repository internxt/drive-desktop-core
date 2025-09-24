import { promises as fs, Stats } from 'fs';

import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { partialSpyOn, deepMocked } from '@/tests/vitest/utils.helper.test';

import * as createCleanableItemModule from '../utils/create-cleanable-item';
import * as wasAccessedWithinLastHourModule from '../utils/was-accessed-within-last-hour';
import { scanSingleFile } from './scan-single-file';

vi.mock(import('fs'));

describe('scanSingleFile', () => {
  const statMock = deepMocked(fs.stat);
  const wasAccessedWithinLastHourMock = partialSpyOn(wasAccessedWithinLastHourModule, 'wasAccessedWithinLastHour');
  const createCleanableItemMock = partialSpyOn(createCleanableItemModule, 'createCleanableItem');

  const mockFilePath = '/home/user/.xsession-errors';
  const mockCleanableItem = {
    fullPath: mockFilePath,
    fileName: '.xsession-errors',
    sizeInBytes: 2048,
  };

  const createMockStats = (isFile = true) => ({ isDirectory: () => !isFile, isFile: () => isFile }) as unknown as Stats;

  beforeEach(() => {
    statMock.mockResolvedValue(createMockStats());
    wasAccessedWithinLastHourMock.mockReturnValue(false);
  });

  it('should return CleanableItem array when file is safe to delete', async () => {
    createCleanableItemMock.mockReturnValue(mockCleanableItem);

    const result = await scanSingleFile({ filePath: mockFilePath });

    expect(result).toStrictEqual([mockCleanableItem]);
    expect(statMock).toBeCalledWith(mockFilePath);
    expect(wasAccessedWithinLastHourMock).toBeCalledWith({ fileStats: expect.any(Object) });
    expect(createCleanableItemMock).toBeCalledWith({ filePath: mockFilePath, stat: expect.any(Object) });
  });

  it('should return empty array when path is not a file', async () => {
    statMock.mockResolvedValue(createMockStats(false));

    const result = await scanSingleFile({ filePath: mockFilePath });

    expect(result).toStrictEqual([]);
    expect(wasAccessedWithinLastHourMock).not.toHaveBeenCalled();
    expect(createCleanableItemMock).not.toHaveBeenCalled();
  });

  it('should return empty array when file was accessed within last hour', async () => {
    wasAccessedWithinLastHourMock.mockReturnValue(true);

    const result = await scanSingleFile({ filePath: mockFilePath });

    expect(result).toStrictEqual([]);
    expect(createCleanableItemMock).not.toHaveBeenCalled();
  });

  it('should handle file access errors gracefully and log warning', async () => {
    statMock.mockRejectedValue(new Error('File not found'));

    const result = await scanSingleFile({ filePath: mockFilePath });

    expect(result).toStrictEqual([]);
    expect(loggerMock.warn).toBeCalledTimes(1);
  });
});
