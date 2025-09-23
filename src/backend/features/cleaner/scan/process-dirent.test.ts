import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';

import * as createCleanableItemMocule from '../utils/create-cleanable-item';
import * as wasAccessedWithinLastHourModule from '../utils/was-accessed-within-last-hour';
import { processDirent } from './process-dirent';
import * as scanDirectoryModule from './scan-directory';

describe('processDirent', () => {
  const wasAccessedWithinLastHourMock = partialSpyOn(wasAccessedWithinLastHourModule, 'wasAccessedWithinLastHour');
  const createCleanableItemMock = partialSpyOn(createCleanableItemMocule, 'createCleanableItem');
  const scanDirectoryMock = partialSpyOn(scanDirectoryModule, 'scanDirectory');
  const mockBasePath = '/test';
  const mockFileName = 'test.txt';
  const mockFullpath = `${mockBasePath}/${mockFileName}`;
  const createMockDirent = (name: string, isFile = true) =>
    mockProps({
      name,
      isFile: () => isFile,
      isDirectory: () => !isFile,
    });

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
    // Given
    createCleanableItemMock.mockResolvedValue(mockCleanableItem);
    // When
    const result = await processDirent({ entry: mockFileDirent, fullPath: mockFullpath });
    // Then
    expect(result).toStrictEqual([mockCleanableItem]);
    expect(wasAccessedWithinLastHourMock).toHaveBeenCalledWith({ filePath: mockFullpath });
    expect(createCleanableItemMock).toHaveBeenCalledWith({ filePath: mockFullpath });
  });

  it('should return empty array when file was accessed within last hour', async () => {
    // Given
    wasAccessedWithinLastHourMock.mockResolvedValue(true);
    // When
    const result = await processDirent({ entry: mockFileDirent, fullPath: mockFullpath });
    // Then
    expect(result).toStrictEqual([]);
    expect(createCleanableItemMock).not.toHaveBeenCalled();
  });

  it('should return empty array when custom filter excludes file', async () => {
    // Given
    const customFileFilter = vi.fn().mockReturnValue(true);
    wasAccessedWithinLastHourMock.mockResolvedValue(false);
    // When
    const result = await processDirent({ entry: mockFileDirent, fullPath: mockFullpath, customFileFilter });
    // Then
    expect(result).toStrictEqual([]);
    expect(customFileFilter).toHaveBeenCalledWith({ fileName: mockFileDirent.name });
    expect(createCleanableItemMock).not.toHaveBeenCalled();
  });

  it('should process directory by calling scanDirectory', async () => {
    // Given
    const mockDir = createMockDirent('subdir', false);
    const mockPath = '/test/subdir';
    const mockDirectoryItems = [mockCleanableItem];
    scanDirectoryMock.mockResolvedValue(mockDirectoryItems);
    // When
    const result = await processDirent({ entry: mockDir, fullPath: mockPath });
    // Then
    expect(result).toStrictEqual(mockDirectoryItems);
    expect(scanDirectoryMock).toHaveBeenCalledTimes(1);
    expect(wasAccessedWithinLastHourMock).not.toHaveBeenCalled();
  });

  it('should process directory when custom directory filter allows it', async () => {
    // Given
    const mockDir = createMockDirent('important-folder', false);
    const mockPath = '/test/important-folder';
    const customDirectoryFilter = vi.fn().mockReturnValue(false);
    const customFileFilter = vi.fn();
    const mockDirectoryItems = [mockCleanableItem];
    scanDirectoryMock.mockResolvedValue(mockDirectoryItems);
    // When
    const result = await processDirent({entry: mockDir, fullPath: mockPath, customDirectoryFilter, customFileFilter });
    // Then
    expect(result).toStrictEqual(mockDirectoryItems);
    expect(customDirectoryFilter).toHaveBeenCalledWith(mockDir.name);
    expect(scanDirectoryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        dirPath: mockPath,
        customFileFilter,
        customDirectoryFilter,
      }),
    );
  });

  it('should handle errors gracefully and log warning', async () => {
    // Given
    wasAccessedWithinLastHourMock.mockRejectedValue(new Error('Permission denied'));
    // When
    const result = await processDirent({ entry: mockFileDirent, fullPath: mockFullpath });
    // Then
    expect(result).toStrictEqual([]);
    expect(loggerMock.warn).toHaveBeenCalledWith({
      msg: `File or Directory with path ${mockFullpath} cannot be accessed, skipping`,
    });
  });
});
