import { promises as fs, Dirent } from 'fs';
import { join } from 'path';
import * as isFileInternextRelatedModule from '../utils/is-file-internxt-related';
import * as scanDirectoryModule from './scan-directory';
import { scanSubDirectory } from './scan-subdirectory';
import { deepMocked, partialSpyOn } from '@/tests/vitest/utils.helper.test';

vi.mock(import('fs'));
vi.mock(import('path'));

describe('scanSubDirectory', () => {
  const readdirMock = deepMocked(fs.readdir);
  const joinMock = deepMocked(join);
  const mockedIsInternxtRelated = partialSpyOn(isFileInternextRelatedModule, 'isInternxtRelated');
  const mockedScanDirectory = partialSpyOn(scanDirectoryModule, 'scanDirectory');

  const createMockDirent = (name: string, isDirectory = true): Dirent<string> =>
    ({
      name,
      isDirectory: () => isDirectory,
      isFile: () => !isDirectory,
    } as Dirent<string>);

  const mockBaseDir = '/home/user/.cache';
  const mockSubDir = 'cache';

  const createCleanableItemMock = (
    appName: string,
    fileName: string,
    size: number,
    basePath = mockBaseDir
  ) => ({
    fullPath: `${basePath}/${appName}/${fileName}`,
    fileName,
    sizeInBytes: size,
  });

  beforeEach(() => {
    joinMock.mockImplementation((...args) => args.join('/'));
    mockedIsInternxtRelated.mockReturnValue(false);
  });

  it('should scan directories given a certain subPath', async () => {
    const mockBaseDir = '/home/user/.local/share';
    const mockDirents = [createMockDirent('app1'), createMockDirent('app2')];

    const mockApp1Items = [
      {
        fullPath: `${mockBaseDir}/app1/${mockSubDir}/file1.cache`,
        fileName: 'file1.cache',
        sizeInBytes: 1024,
      },
    ];
    const mockApp2Items = [
      {
        fullPath: `${mockBaseDir}/app2/${mockSubDir}/file2.cache`,
        fileName: 'file2.cache',
        sizeInBytes: 2048,
      },
    ];

    (readdirMock as any).mockResolvedValue(mockDirents);

    mockedScanDirectory
      .mockResolvedValueOnce(mockApp1Items)
      .mockResolvedValueOnce(mockApp2Items);

    const result = await scanSubDirectory({
      baseDir: mockBaseDir,
      subPath: mockSubDir,
    });

    expect(result).toStrictEqual([...mockApp1Items, ...mockApp2Items]);
    expect(mockedScanDirectory).toHaveBeenCalledWith(
      expect.objectContaining({ dirPath: `${mockBaseDir}/app1/${mockSubDir}` })
    );
    expect(mockedScanDirectory).toHaveBeenCalledWith(
      expect.objectContaining({ dirPath: `${mockBaseDir}/app2/${mockSubDir}` })
    );
  });

  it('should handle scanDirectory errors gracefully', async () => {
    const mockDirents = [createMockDirent('app1'), createMockDirent('app2')];
    const app2Items = [createCleanableItemMock('app2', 'cache.tmp', 1024)];

    (readdirMock as any).mockResolvedValue(mockDirents);
    mockedScanDirectory
      .mockRejectedValueOnce(new Error('Permission denied'))
      .mockResolvedValueOnce(app2Items);

    const result = await scanSubDirectory({
      baseDir: mockBaseDir,
      subPath: mockSubDir,
    });

    expect(result).toStrictEqual(app2Items);
    expect(mockedScanDirectory).toHaveBeenCalledTimes(2);
  });
});
