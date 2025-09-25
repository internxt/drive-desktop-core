import { Dirent, promises as fs } from 'fs';

import { mockProps, partialSpyOn, deepMocked } from '@/tests/vitest/utils.helper.test';

import * as scanDirectoryModule from '../../scan/scan-directory';
import { CleanableItem, CleanerContext } from '../../types/cleaner.types';
import * as isFirefoxProfileDirectoryModule from '../../utils/is-firefox-profile-directory';
import * as webBrowserFileFilterModule from '../../utils/is-safe-web-browser-file';
import { scanFirefoxCacheProfiles } from './scan-firefox-cache-profiles';

vi.mock(import('fs'));

describe('scanFirefoxCacheProfiles', () => {
  const mockedScanDirectory = partialSpyOn(scanDirectoryModule, 'scanDirectory');
  const mockedIsFirefoxProfileDirectory = partialSpyOn(isFirefoxProfileDirectoryModule, 'isFirefoxProfileDirectory');
  const mockedWebBrowserFileFilter = partialSpyOn(webBrowserFileFilterModule, 'webBrowserFileFilter');
  const readdirMock = deepMocked(fs.readdir);

  const mockContext = mockProps<typeof scanFirefoxCacheProfiles>({
    ctx: {} as CleanerContext,
    firefoxCacheDir: '/home/user/.cache/mozilla/firefox',
  });

  const createMockItem = (fileName: string, size: number, basePath: string): CleanableItem => ({
    fullPath: `${basePath}/${fileName}`,
    fileName,
    sizeInBytes: size,
  });

  beforeEach(() => {
    mockedScanDirectory.mockResolvedValue([]);
    mockedIsFirefoxProfileDirectory.mockResolvedValue(false);
    readdirMock.mockResolvedValue([]);
  });

  it('should return empty array when no entries found in cache directory', async () => {
    // Given/When
    const result = await scanFirefoxCacheProfiles(mockContext);
    // Then
    expect(result).toEqual([]);
    expect(readdirMock).toHaveBeenCalledWith(mockContext.firefoxCacheDir);
    expect(mockedIsFirefoxProfileDirectory).not.toHaveBeenCalled();
    expect(mockedScanDirectory).not.toHaveBeenCalled();
  });

  it('should scan valid Firefox profile cache directories', async () => {
    // Given
    const profileEntries = ['rwt14re6.default', 'abc123.test-profile', 'Crash Reports', 'Pending Pings'] as unknown as Dirent<Buffer>[];
    const cacheItems = [
      createMockItem('cache-file1.dat', 1024, '/home/user/.cache/mozilla/firefox/rwt14re6.default/cache2'),
      createMockItem('thumbnail1.png', 512, '/home/user/.cache/mozilla/firefox/rwt14re6.default/thumbnails'),
      createMockItem('startup1.bin', 256, '/home/user/.cache/mozilla/firefox/rwt14re6.default/startupCache'),
    ];
    readdirMock.mockResolvedValue(profileEntries);
    mockedIsFirefoxProfileDirectory
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(false);
    mockedScanDirectory
      .mockResolvedValueOnce([cacheItems[0]])
      .mockResolvedValueOnce([cacheItems[1]])
      .mockResolvedValueOnce([cacheItems[2]]);
    // When
    const result = await scanFirefoxCacheProfiles(mockContext);
    // Then
    expect(result).toStrictEqual(cacheItems);
    expect(readdirMock).toBeCalledWith(mockContext.firefoxCacheDir);
    expect(mockedIsFirefoxProfileDirectory).toBeCalledTimes(4);
    expect(mockedScanDirectory).toBeCalledTimes(3);
  });

  it('should call scanDirectory with correct parameters for each cache directory', async () => {
    // Given
    const profileEntries = ['profile1.default'] as unknown as Dirent<Buffer>[];
    readdirMock.mockResolvedValue(profileEntries);
    mockedIsFirefoxProfileDirectory.mockResolvedValue(true);
    // When
    await scanFirefoxCacheProfiles(mockContext);
    // Then
    expect(mockedScanDirectory).toBeCalledTimes(3);
    expect(mockedScanDirectory).nthCalledWith(1, {
      ctx: mockContext.ctx,
      dirPath: expect.stringContaining('profile1.default'),
      customFileFilter: mockedWebBrowserFileFilter,
    });
    expect(mockedScanDirectory).nthCalledWith(
      1,
      expect.objectContaining({
        dirPath: expect.stringMatching(/cache2$/),
      }),
    );
    expect(mockedScanDirectory).nthCalledWith(2, {
      ctx: mockContext.ctx,
      dirPath: expect.stringContaining('profile1.default'),
      customFileFilter: mockedWebBrowserFileFilter,
    });
    expect(mockedScanDirectory).nthCalledWith(
      2,
      expect.objectContaining({
        dirPath: expect.stringMatching(/thumbnails$/),
      }),
    );
    expect(mockedScanDirectory).nthCalledWith(3, {
      ctx: mockContext.ctx,
      dirPath: expect.stringContaining('profile1.default'),
      customFileFilter: mockedWebBrowserFileFilter,
    });
    expect(mockedScanDirectory).nthCalledWith(
      3,
      expect.objectContaining({
        dirPath: expect.stringMatching(/startupCache$/),
      }),
    );
  });

  it('should scan multiple profile directories correctly', async () => {
    // Given
    const profileEntries = ['profile1.default', 'profile2.test'] as unknown as Dirent<Buffer>[];
    const profile1Items = [createMockItem('cache1.dat', 1024, '/path/to/profile1/cache2')];
    const profile2Items = [createMockItem('cache2.dat', 2048, '/path/to/profile2/cache2')];
    readdirMock.mockResolvedValue(profileEntries);
    mockedIsFirefoxProfileDirectory.mockResolvedValue(true);
    mockedScanDirectory
      .mockResolvedValueOnce([profile1Items[0]])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([profile2Items[0]])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    // When
    const result = await scanFirefoxCacheProfiles(mockContext);
    // Then
    expect(result).toStrictEqual([...profile1Items, ...profile2Items]);
    expect(mockedScanDirectory).toBeCalledTimes(6);
  });

  it('should handle Promise.allSettled rejections gracefully for profile directory checks', async () => {
    // Given
    const profileEntries = ['profile1.default', 'profile2.test'] as unknown as Dirent<Buffer>[];
    readdirMock.mockResolvedValue(profileEntries);
    mockedIsFirefoxProfileDirectory.mockRejectedValueOnce(new Error('Permission denied')).mockResolvedValueOnce(true);
    // When
    const result = await scanFirefoxCacheProfiles(mockContext);
    // Then
    expect(result).toStrictEqual([]);
    expect(mockedScanDirectory).toBeCalledTimes(3);
  });

  it('should handle Promise.allSettled rejections gracefully for scan operations', async () => {
    // Given
    const profileEntries = ['profile1.default'] as unknown as Dirent<Buffer>[];
    const successItems = [createMockItem('success.cache', 1024, '/path/to/cache')];
    readdirMock.mockResolvedValue(profileEntries);
    mockedIsFirefoxProfileDirectory.mockResolvedValue(true);
    mockedScanDirectory
      .mockRejectedValueOnce(new Error('Permission denied'))
      .mockResolvedValueOnce(successItems)
      .mockRejectedValueOnce(new Error('Directory not found'));
    // When
    const result = await scanFirefoxCacheProfiles(mockContext);
    // Then
    expect(result).toStrictEqual(successItems);
    expect(mockedScanDirectory).toBeCalledTimes(3);
  });

  it('should silently ignore errors when reading cache directory', async () => {
    // Given
    readdirMock.mockRejectedValue(new Error('Directory not found'));
    // When
    const result = await scanFirefoxCacheProfiles(mockContext);
    // Then
    expect(result).toStrictEqual([]);
    expect(readdirMock).toBeCalledWith(mockContext.firefoxCacheDir);
    expect(mockedIsFirefoxProfileDirectory).not.toBeCalled();
    expect(mockedScanDirectory).not.toBeCalled();
  });

  it('should use webBrowserFileFilter for all scan operations', async () => {
    // Given
    const profileEntries = ['profile.default'] as unknown as Dirent<Buffer>[];
    readdirMock.mockResolvedValue(profileEntries);
    mockedIsFirefoxProfileDirectory.mockResolvedValue(true);
    // When
    await scanFirefoxCacheProfiles(mockContext);
    // Then
    expect(mockedScanDirectory).toBeCalledTimes(3);
    expect(mockedScanDirectory).nthCalledWith(
      1,
      expect.objectContaining({
        customFileFilter: mockedWebBrowserFileFilter,
      }),
    );
    expect(mockedScanDirectory).nthCalledWith(
      2,
      expect.objectContaining({
        customFileFilter: mockedWebBrowserFileFilter,
      }),
    );
    expect(mockedScanDirectory).nthCalledWith(
      3,
      expect.objectContaining({
        customFileFilter: mockedWebBrowserFileFilter,
      }),
    );
  });
});
