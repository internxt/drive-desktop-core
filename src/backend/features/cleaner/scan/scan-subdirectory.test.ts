import { promises as fs, Dirent } from 'fs';
import { join } from 'path';

import { deepMocked, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';

import { CleanableItem, CleanerContext } from '../types/cleaner.types';
import * as isFileInternextRelatedModule from '../utils/is-file-internxt-related';
import * as scanDirectoryModule from './scan-directory';
import { scanSubDirectory } from './scan-subdirectory';

vi.mock(import('fs'));
vi.mock(import('path'));

describe('scanSubDirectory', () => {
  const readdirMock = deepMocked(fs.readdir);
  const joinMock = deepMocked(join);
  const mockedIsInternxtRelated = partialSpyOn(isFileInternextRelatedModule, 'isInternxtRelated');
  const mockedScanDirectory = partialSpyOn(scanDirectoryModule, 'scanDirectory');

  const createMockDirent = (name: string, isDirectory = true) =>
    mockProps({
      name,
      isDirectory: () => isDirectory,
      isFile: () => !isDirectory,
    }) as unknown as Dirent<Buffer>;

  const mockBaseDir = '/home/user/.cache';
  const mockSubDir = 'cache';

  const createCleanableItemMock = (appName: string, fileName: string, size: number, basePath = mockBaseDir) =>
    mockProps({
      fullPath: `${basePath}/${appName}/${fileName}`,
      fileName,
      sizeInBytes: size,
    }) as unknown as CleanableItem;

  beforeEach(() => {
    joinMock.mockImplementation((...args) => args.join('/'));
    mockedIsInternxtRelated.mockReturnValue(false);
  });

  it('should scan directories given a certain subPath', async () => {
    // Given
    const mockBaseDir = '/home/user/.local/share';
    const mockDirents = [createMockDirent('app1'), createMockDirent('app2')];
    const mockApp1Items = [createCleanableItemMock('app1', 'file1.cache', 1024)];
    const mockApp2Items = [createCleanableItemMock('app2', 'file2.cache', 2048)];
    readdirMock.mockResolvedValue(mockDirents);
    mockedScanDirectory.mockResolvedValueOnce(mockApp1Items).mockResolvedValueOnce(mockApp2Items);
    // When
    const result = await scanSubDirectory({
      ctx: {} as CleanerContext,
      baseDir: mockBaseDir,
      subPath: mockSubDir,
    });
    // Then
    expect(result).toStrictEqual([...mockApp1Items, ...mockApp2Items]);
    expect(mockedScanDirectory).toHaveBeenCalledWith(expect.objectContaining({ dirPath: `${mockBaseDir}/app1/${mockSubDir}` }));
    expect(mockedScanDirectory).toHaveBeenCalledWith(expect.objectContaining({ dirPath: `${mockBaseDir}/app2/${mockSubDir}` }));
  });

  it('should handle scanDirectory errors gracefully', async () => {
    // Given
    const mockDirents = [createMockDirent('app1'), createMockDirent('app2')];
    const app2Items = [createCleanableItemMock('app2', 'cache.tmp', 1024)];
    readdirMock.mockResolvedValue(mockDirents);
    mockedScanDirectory.mockRejectedValueOnce(new Error('Permission denied')).mockResolvedValueOnce(app2Items);
    // When
    const result = await scanSubDirectory({
      ctx: {} as CleanerContext,
      baseDir: mockBaseDir,
      subPath: mockSubDir,
    });
    // Then
    expect(result).toStrictEqual(app2Items);
    expect(mockedScanDirectory).toHaveBeenCalledTimes(2);
  });
});
