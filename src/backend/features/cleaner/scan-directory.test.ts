import { Dirent, promises as fs, Stats } from 'fs';
import path from 'path';
import { vi, MockedFunction } from 'vitest';

import { processDirent } from './process-dirent';
import { scanDirectory } from './scan-directory';
import { isInternxtRelated } from './utils/is-file-internxt-related';

vi.mock('fs', () => ({
  promises: {
    readdir: vi.fn(),
  },
}));
vi.mock('path');
vi.mock('./utils/is-file-internxt-related');
vi.mock('./process-dirent');

const createMockStats = (isDirectory = true, size = 0): Stats => ({ isDirectory: () => isDirectory, size }) as Stats;

const createMockDirent = (name: string, isFile = true) =>
  ({
    name,
    isFile: () => isFile,
    isDirectory: () => !isFile,
  }) as Dirent<string>;

describe('scanDirectory', () => {
  const mockedFs = vi.mocked(fs);
  const mockedPath = vi.mocked(path);
  const mockBasePath = '/test/path';
  const mockedIsInternxtRelated = vi.mocked(isInternxtRelated);
  const mockedProcessDirent = vi.mocked(processDirent);

  // Type the readdir mock correctly for withFileTypes: true
  const mockedReaddir = mockedFs.readdir as unknown as MockedFunction<
    (path: string, options: { withFileTypes: true; encoding?: 'utf8' }) => Promise<Dirent[]>
  >;

  const createCleanableItemMock = (fileName: string, size: number, basePath = mockBasePath) => ({
    fullPath: `${basePath}/${fileName}`,
    fileName,
    sizeInBytes: size,
  });

  beforeEach(() => {
    mockedPath.join.mockImplementation((...args) => args.join('/'));
    mockedIsInternxtRelated.mockReturnValue(false);
    mockedFs.stat.mockResolvedValue(createMockStats(true));
  });

  it('should return empty array when directory is not a directory', async () => {
    mockedFs.stat.mockResolvedValue(createMockStats(false));

    const result = await scanDirectory({ dirPath: mockBasePath });

    expect(result).toStrictEqual([]);
    expect(mockedFs.readdir).not.toHaveBeenCalled();
  });

  it('should return empty array when directory cannot be accessed', async () => {
    mockedFs.stat.mockRejectedValue(new Error('Permission denied'));

    const result = await scanDirectory({ dirPath: mockBasePath });

    expect(result).toStrictEqual([]);
  });

  it('should scan files in directory correctly', async () => {
    mockedReaddir.mockResolvedValue([createMockDirent('file1.txt', true)]);

    const expectedItem = createCleanableItemMock('file1.txt', 2048);
    mockedProcessDirent.mockResolvedValue([expectedItem]);

    const result = await scanDirectory({ dirPath: mockBasePath });

    expect(result).toStrictEqual([expectedItem]);
    expect(mockedProcessDirent).toHaveBeenCalledWith(
      expect.objectContaining({
        entry: expect.objectContaining({ name: 'file1.txt' }),
        fullPath: '/test/path/file1.txt',
        customFileFilter: undefined,
      }),
    );
  });

  it('should skip Internxt-related files and directories', async () => {
    mockedReaddir.mockResolvedValue([createMockDirent('internxt-app', false), createMockDirent('regular-file.txt', true)]);

    mockedIsInternxtRelated.mockReturnValueOnce(true).mockReturnValueOnce(false);

    const expectedItem = createCleanableItemMock('regular-file.txt', 1024);
    mockedProcessDirent.mockResolvedValue([expectedItem]);

    const result = await scanDirectory({ dirPath: mockBasePath });

    expect(result).toStrictEqual([expectedItem]);
    expect(isInternxtRelated).toHaveBeenCalledWith('/test/path/internxt-app');
    expect(isInternxtRelated).toHaveBeenCalledWith('/test/path/regular-file.txt');
    expect(mockedProcessDirent).toHaveBeenCalledTimes(1);
    expect(mockedProcessDirent).toHaveBeenCalledWith(
      expect.objectContaining({
        entry: expect.objectContaining({ name: 'regular-file.txt' }),
        fullPath: '/test/path/regular-file.txt',
        customFileFilter: undefined,
      }),
    );
  });

  it('should recursively scan subdirectories', async () => {
    const dirent = createMockDirent('subdir', false);
    mockedReaddir.mockResolvedValue([dirent]);

    const expectedItem = [createCleanableItemMock('nested-file.txt', 512, '/test/path/subdir')];
    mockedProcessDirent.mockResolvedValue(expectedItem);

    const result = await scanDirectory({ dirPath: mockBasePath });

    expect(result).toStrictEqual(expectedItem);
    expect(mockedFs.readdir).toHaveBeenCalledWith(
      mockBasePath,
      expect.objectContaining({
        withFileTypes: true,
      }),
    );

    expect(mockedProcessDirent).toHaveBeenCalledWith(
      expect.objectContaining({
        entry: dirent,
        fullPath: '/test/path/subdir',
        customFileFilter: undefined,
      }),
    );
  });

  it('should handle mixed files and directories', async () => {
    mockedReaddir.mockResolvedValue([
      createMockDirent('file1.txt', true),
      createMockDirent('subdir', false),
      createMockDirent('file2.log', true),
    ]);

    const file1Item = createCleanableItemMock('file1.txt', 100);
    const file2Item = createCleanableItemMock('file2.log', 300);
    const subdirItem = createCleanableItemMock('nested.txt', 200, '/test/path/subdir');
    mockedProcessDirent.mockResolvedValueOnce([file1Item]).mockResolvedValueOnce([subdirItem]).mockResolvedValueOnce([file2Item]);

    const result = await scanDirectory({ dirPath: mockBasePath });

    expect(result).toStrictEqual([file1Item, subdirItem, file2Item]);
    expect(mockedProcessDirent).toHaveBeenCalledTimes(3);
  });

  it('should skip files that cannot be accessed due to permissions', async () => {
    mockedReaddir.mockResolvedValue([createMockDirent('accessible-file.txt', true), createMockDirent('restricted-file.txt', true)]);

    const accessibleItem = [createCleanableItemMock('accessible-file.txt', 1024)];
    mockedProcessDirent.mockResolvedValueOnce(accessibleItem).mockResolvedValueOnce([]);

    const result = await scanDirectory({ dirPath: mockBasePath });

    expect(result).toStrictEqual(accessibleItem);
    expect(mockedProcessDirent).toHaveBeenCalledTimes(2);
  });

  it('should handle empty directories', async () => {
    mockedReaddir.mockResolvedValue([]);

    const result = await scanDirectory({ dirPath: mockBasePath });

    expect(result).toStrictEqual([]);
    expect(mockedProcessDirent).toHaveBeenCalledTimes(0);
  });

  it('should handle readdir errors gracefully', async () => {
    mockedFs.stat.mockResolvedValue(createMockStats(true));
    mockedFs.readdir.mockRejectedValue(new Error('Cannot read directory'));

    const result = await scanDirectory({ dirPath: mockBasePath });

    expect(result).toStrictEqual([]);
  });
});
