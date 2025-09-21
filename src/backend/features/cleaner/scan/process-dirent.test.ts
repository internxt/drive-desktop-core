import { Dirent } from 'fs';
import { processDirent } from './process-dirent';
import * as wasAccessedWithinLastHourModule from '../utils/was-accessed-within-last-hour';
import * as createCleanableItemMocule from '../utils/create-cleanable-item';
import * as scanDirectoryModule from './scan-directory';
import { partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';

describe('processDirent', () => {
  const wasAccessedWithinLastHourMock = partialSpyOn(
    wasAccessedWithinLastHourModule, 'wasAccessedWithinLastHour'
  );
  const createCleanableItemMock = partialSpyOn(createCleanableItemMocule, 'createCleanableItem');
  const scanDirectoryMock = partialSpyOn(scanDirectoryModule, 'scanDirectory');
  const mockBasePath = '/test';
  const mockFileName = 'test.txt';
  const mockFullpath = `${mockBasePath}/${mockFileName}`;
  const createMockDirent = (name: string, isFile = true): Dirent =>
    ({
      name,
      isFile: () => isFile,
      isDirectory: () => !isFile,
    } as Dirent);

  const mockFileDirent = createMockDirent(mockFileName);
  const mockCleanableItem = {
    fullPath: mockFullpath,
    fileName: mockFileName,
    sizeInBytes: 1024,
  };

  beforeEach(() => {
    wasAccessedWithinLastHourMock.mockResolvedValue(false);
  });

  it('should process file and return CleanableItem when file is safe to delete', async () => {
    createCleanableItemMock.mockResolvedValue(mockCleanableItem);
    const result = await processDirent({
      entry: mockFileDirent,
      fullPath: mockFullpath,
    });

    expect(result).toStrictEqual([mockCleanableItem]);
    expect(wasAccessedWithinLastHourMock).toHaveBeenCalledWith(mockFullpath);
    expect(createCleanableItemMock).toHaveBeenCalledWith(mockFullpath);
  });

  it('should return empty array when file was accessed within last hour', async () => {
    wasAccessedWithinLastHourMock.mockResolvedValue(true);

    const result = await processDirent({
      entry: mockFileDirent,
      fullPath: mockFullpath,
    });

    expect(result).toStrictEqual([]);
    expect(createCleanableItemMock).not.toHaveBeenCalled();
  });

  it('should return empty array when custom filter excludes file', async () => {
    const customFileFilter = vi.fn().mockReturnValue(true);
    wasAccessedWithinLastHourMock.mockResolvedValue(false);
    const result = await processDirent({
      entry: mockFileDirent,
      fullPath: mockFullpath,
      customFileFilter,
    });

    expect(result).toStrictEqual([]);
    expect(customFileFilter).toHaveBeenCalledWith(mockFileDirent.name);
    expect(createCleanableItemMock).not.toHaveBeenCalled();
  });

  it('should process directory by calling scanDirectory', async () => {
    const mockDir = createMockDirent('subdir', false);
    const mockPath = '/test/subdir';
    const mockDirectoryItems = [mockCleanableItem];

    scanDirectoryMock.mockResolvedValue(mockDirectoryItems);

    const result = await processDirent({
      entry: mockDir,
      fullPath: mockPath,
    });

    expect(result).toStrictEqual(mockDirectoryItems);
    expect(scanDirectoryMock).toHaveBeenCalledTimes(1);
    expect(wasAccessedWithinLastHourMock).not.toHaveBeenCalled();
  });

  it('should process directory when custom directory filter allows it', async () => {
    const mockDir = createMockDirent('important-folder', false);
    const mockPath = '/test/important-folder';
    const customDirectoryFilter = vi.fn().mockReturnValue(false);
    const customFileFilter = vi.fn();
    const mockDirectoryItems = [mockCleanableItem];

    scanDirectoryMock.mockResolvedValue(mockDirectoryItems);

    const result = await processDirent({
      entry: mockDir,
      fullPath: mockPath,
      customDirectoryFilter,
      customFileFilter,
    });

    expect(result).toStrictEqual(mockDirectoryItems);
    expect(customDirectoryFilter).toHaveBeenCalledWith(mockDir.name);
    expect(scanDirectoryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        dirPath: mockPath,
        customFileFilter,
        customDirectoryFilter,
      })
    );
  });

  it('should handle errors gracefully and log warning', async () => {
    wasAccessedWithinLastHourMock.mockRejectedValue(
      new Error('Permission denied')
    );

    const result = await processDirent({
      entry: mockFileDirent,
      fullPath: mockFullpath,
    });

    expect(result).toStrictEqual([]);
    expect(loggerMock.warn).toHaveBeenCalledWith({
      msg: `File or Directory with path ${mockFullpath} cannot be accessed, skipping`,
    });
  });
});
