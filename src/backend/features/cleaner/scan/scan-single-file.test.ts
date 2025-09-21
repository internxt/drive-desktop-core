import { Stats, promises as fs } from 'fs';
import { scanSingleFile } from './scan-single-file';
import * as wasAccessedWithinLastHourModule from '../utils/was-accessed-within-last-hour';
import * as createCleanableItemModule from '../utils/create-cleanable-item';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { partialSpyOn, deepMocked } from '@/tests/vitest/utils.helper.test';

vi.mock(import('fs'));

describe('scanSingleFile', () => {
  const statMock = deepMocked(fs.stat);
  const wasAccessedWithinLastHourMock = partialSpyOn(
    wasAccessedWithinLastHourModule,
    'wasAccessedWithinLastHour'
  );
  const createCleanableItemMock = partialSpyOn(
    createCleanableItemModule,
    'createCleanableItem'
  );

  const mockFilePath = '/home/user/.xsession-errors';
  const mockCleanableItem = {
    fullPath: mockFilePath,
    fileName: '.xsession-errors',
    sizeInBytes: 2048,
  };

  const createMockStats = (isFile = true, size = 0): Stats =>
    ({ isDirectory: () => !isFile, isFile: () => isFile, size } as Stats);

  beforeEach(() => {
    statMock.mockResolvedValue(createMockStats());
    wasAccessedWithinLastHourMock.mockResolvedValue(false);
  });

  it('should return CleanableItem array when file is safe to delete', async () => {
    createCleanableItemMock.mockResolvedValue(mockCleanableItem);

    const result = await scanSingleFile(mockFilePath);

    expect(result).toStrictEqual([mockCleanableItem]);
    expect(statMock).toHaveBeenCalledWith(mockFilePath);
    expect(wasAccessedWithinLastHourMock).toHaveBeenCalledWith(mockFilePath);
    expect(createCleanableItemMock).toHaveBeenCalledWith(mockFilePath);
  });

  it('should return empty array when path is not a file', async () => {
    statMock.mockResolvedValue(createMockStats(false));

    const result = await scanSingleFile(mockFilePath);

    expect(result).toStrictEqual([]);
    expect(wasAccessedWithinLastHourMock).not.toHaveBeenCalled();
    expect(createCleanableItemMock).not.toHaveBeenCalled();
  });

  it('should return empty array when file was accessed within last hour', async () => {
    wasAccessedWithinLastHourMock.mockResolvedValue(true);

    const result = await scanSingleFile(mockFilePath);

    expect(result).toStrictEqual([]);
    expect(createCleanableItemMock).not.toHaveBeenCalled();
  });

  it('should handle file access errors gracefully and log warning', async () => {
    statMock.mockRejectedValue(new Error('File not found'));

    const result = await scanSingleFile(mockFilePath);

    expect(result).toStrictEqual([]);
    expect(loggerMock.warn).toHaveBeenCalledWith({
      msg: `Single file with file path ${mockFilePath} cannot be accessed, skipping`,
    });
  });
});
