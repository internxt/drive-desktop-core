import { scanDirectory } from './scan-directory';
import { Stats, Dirent } from 'fs';
import { promises as fs } from 'fs';
import path from 'path';
import * as isInternxtRelatedModule from '../utils/is-file-internxt-related';
import * as processDirentModule from './process-dirent';
import { deepMocked, partialSpyOn } from '@/tests/vitest/utils.helper.test';

vi.mock(import('fs'));
vi.mock(import('path'));

const createMockStats = (isDirectory = true, size = 0): Stats =>
  ({ isDirectory: () => isDirectory, size } as Stats);

const createMockDirent = (name: string, isFile = true) =>
  ({ 
    name, 
    isFile: () => isFile, 
    isDirectory: () => !isFile,
  }) as Dirent;

describe('scanDirectory', () => {
  const readdirMock = deepMocked(fs.readdir);
  const statMock = deepMocked(fs.stat);
  const joinMock = deepMocked(path.join);
  const mockBasePath = '/test/path';
  const isInternxtRelatedMock = partialSpyOn(isInternxtRelatedModule, "isInternxtRelated", false);
  const processDirentMock = partialSpyOn(processDirentModule, "processDirent", false);

  const createCleanableItemMock = (
    fileName: string,
    size: number,
    basePath = mockBasePath
  ) => ({
    fullPath: `${basePath}/${fileName}`,
    fileName,
    sizeInBytes: size,
  });

  beforeEach(() => {
    joinMock.mockImplementation((...args) => args.join('/'));
    isInternxtRelatedMock.mockReturnValue(false);
    statMock.mockResolvedValue(createMockStats(true));
  });

  it('should return empty array when directory is not a directory', async () => {
    statMock.mockResolvedValue(createMockStats(false));

    const result = await scanDirectory({ dirPath: mockBasePath });

    expect(result).toStrictEqual([]);
    expect(readdirMock).not.toHaveBeenCalled();
  });

  it('should return empty array when directory cannot be accessed', async () => {
    statMock.mockRejectedValue(new Error('Permission denied'));

    const result = await scanDirectory({ dirPath: mockBasePath });

    expect(result).toStrictEqual([]);
  });

  it('should scan files in directory correctly', async () => {
    (readdirMock as any).mockResolvedValue([createMockDirent('file1.txt', true)]);

    const expectedItem = createCleanableItemMock('file1.txt', 2048);
    processDirentMock.mockResolvedValue([expectedItem]);

    const result = await scanDirectory({ dirPath: mockBasePath });

    expect(statMock).toHaveBeenCalled();
    expect(readdirMock).toHaveBeenCalled();
    expect(processDirentMock).toHaveBeenCalled();
    expect(result).toStrictEqual([expectedItem]);
    expect(processDirentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        entry: expect.objectContaining({ name: 'file1.txt' }),
        fullPath: '/test/path/file1.txt',
        customFileFilter: undefined,
      })
    );
  });

  it('should skip Internxt-related files and directories', async () => {
    (readdirMock as any).mockResolvedValue([
      createMockDirent('internxt-app', false),
      createMockDirent('regular-file.txt', true),
    ]);

    isInternxtRelatedMock
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false);

    const expectedItem = createCleanableItemMock('regular-file.txt', 1024);
    processDirentMock.mockResolvedValue([expectedItem]);

    const result = await scanDirectory({ dirPath: mockBasePath });

    expect(result).toStrictEqual([expectedItem]);
    expect(isInternxtRelatedMock).toHaveBeenCalledWith('/test/path/internxt-app');
    expect(isInternxtRelatedMock).toHaveBeenCalledWith(
      '/test/path/regular-file.txt'
    );
    expect(processDirentMock).toHaveBeenCalledTimes(1);
    expect(processDirentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        entry: expect.objectContaining({ name: 'regular-file.txt' }),
        fullPath: '/test/path/regular-file.txt',
        customFileFilter: undefined,
      })
    );
  });

  it('should recursively scan subdirectories', async () => {
    const dirent = createMockDirent('subdir', false);
    (readdirMock as any).mockResolvedValue([dirent]);

    const expectedItem = [
      createCleanableItemMock('nested-file.txt', 512, '/test/path/subdir'),
    ];
    processDirentMock.mockResolvedValue(expectedItem);

    const result = await scanDirectory({ dirPath: mockBasePath });

    expect(result).toStrictEqual(expectedItem);
    expect(readdirMock).toHaveBeenCalledWith(mockBasePath, {
      withFileTypes: true,
    });
    expect(processDirentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        entry: dirent,
        fullPath: '/test/path/subdir',
        customFileFilter: undefined,
      })
    );
  });

  it('should handle mixed files and directories', async () => {
    (readdirMock as any).mockResolvedValue([
      createMockDirent('file1.txt', true),
      createMockDirent('subdir', false),
      createMockDirent('file2.log', true),
    ]);

    const file1Item = createCleanableItemMock('file1.txt', 100);
    const file2Item = createCleanableItemMock('file2.log', 300);
    const subdirItem = createCleanableItemMock(
      'nested.txt',
      200,
      '/test/path/subdir'
    );
    processDirentMock
      .mockResolvedValueOnce([file1Item])
      .mockResolvedValueOnce([subdirItem])
      .mockResolvedValueOnce([file2Item]);

    const result = await scanDirectory({ dirPath: mockBasePath });

    expect(result).toStrictEqual([file1Item, subdirItem, file2Item]);
    expect(processDirentMock).toHaveBeenCalledTimes(3);
  });

  it('should skip files that cannot be accessed due to permissions', async () => {
    (readdirMock as any).mockResolvedValue([
      createMockDirent('accessible-file.txt', true),
      createMockDirent('restricted-file.txt', true),
    ]);

    const accessibleItem = [
      createCleanableItemMock('accessible-file.txt', 1024),
    ];
    processDirentMock
      .mockResolvedValueOnce(accessibleItem)
      .mockResolvedValueOnce([]);

    const result = await scanDirectory({ dirPath: mockBasePath });

    expect(result).toStrictEqual(accessibleItem);
    expect(processDirentMock).toHaveBeenCalledTimes(2);
  });

  it('should handle empty directories', async () => {
    (readdirMock as any).mockResolvedValue([]);

    const result = await scanDirectory({ dirPath: mockBasePath });

    expect(result).toStrictEqual([]);
    expect(processDirentMock).toHaveBeenCalledTimes(0);
  });

  it('should handle readdir errors gracefully', async () => {
    statMock.mockResolvedValue(createMockStats(true));
    readdirMock.mockRejectedValue(new Error('Cannot read directory'));

    const result = await scanDirectory({ dirPath: mockBasePath });

    expect(result).toStrictEqual([]);
  });
});
