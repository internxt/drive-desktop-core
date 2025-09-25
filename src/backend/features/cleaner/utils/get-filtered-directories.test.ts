import { promises as fs, Dirent } from 'fs';

import { deepMocked } from '@/tests/vitest/utils.helper.test';

import { getFilteredDirectories } from './get-filtered-directories';

vi.mock(import('fs'));

describe('getFilteredDirectories', () => {
  const mockReaddir = deepMocked(fs.readdir);

  const createMockDirent = (name: string, isDirectory = true) =>
    ({
      name,
      isDirectory: () => isDirectory,
    }) as unknown as Dirent<Buffer>;

  it('should filter out Internxt-related directories and return only regular directories', async () => {
    // Given
    const mockDirents = [
      createMockDirent('Documents', true),
      createMockDirent('internxt-folder', true),
      createMockDirent('drive-desktop-cache', true),
      createMockDirent('Pictures', true),
      createMockDirent('file.txt', false),
      createMockDirent('Videos', true),
    ];
    mockReaddir.mockResolvedValue(mockDirents);
    // When
    const result = await getFilteredDirectories({ baseDir: '/test/path' });
    // Then
    expect(result).toHaveLength(3);
    expect(result.map((d) => d.name)).toEqual(['Documents', 'Pictures', 'Videos']);
  });

  it('should apply custom directory filter when provided', async () => {
    // Given
    const mockDirents = [
      createMockDirent('Documents', true),
      createMockDirent('Pictures', true),
      createMockDirent('Videos', true),
      createMockDirent('TempFolder', true),
      createMockDirent('file.txt', false),
    ];
    const customFilter = (directoryName: string) => directoryName === 'TempFolder';
    mockReaddir.mockResolvedValue(mockDirents);
    // When
    const result = await getFilteredDirectories({
      baseDir: '/test/path',
      customDirectoryFilter: customFilter,
    });
    // Then
    expect(result).toHaveLength(3);
    expect(result.map((d) => d.name)).toEqual(['Documents', 'Pictures', 'Videos']);
    expect(result.map((d) => d.name)).not.toContain('TempFolder');
  });

  it('should return empty array when no directories match the filters', async () => {
    // Given
    const mockDirents = [
      createMockDirent('internxt-data', true),
      createMockDirent('INTERNXT-Cache', true),
      createMockDirent('drive-desktop-logs', true),
      createMockDirent('file1.txt', false),
      createMockDirent('file2.pdf', false),
    ];
    mockReaddir.mockResolvedValue(mockDirents);
    // When
    const result = await getFilteredDirectories({ baseDir: '/test/path' });
    // Then
    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });
});
