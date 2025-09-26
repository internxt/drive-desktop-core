import { Dirent } from 'fs';
import { readdir } from 'fs/promises';

import { mockProps, partialSpyOn, deepMocked } from '@/tests/vitest/utils.helper.test';

import * as scanDirectoryModule from '../../scan/scan-directory';
import { CleanableItem, CleanerContext } from '../../types/cleaner.types';
import * as isFirefoxProfileDirectoryModule from '../../utils/is-firefox-profile-directory';
import { scanFirefoxProfiles } from './scan-firefox-profiles';

vi.mock(import('fs/promises'));

describe('scanFirefoxProfiles', () => {
  const mockedScanDirectory = partialSpyOn(scanDirectoryModule, 'scanDirectory');
  const mockedIsFirefoxProfileDirectory = partialSpyOn(isFirefoxProfileDirectoryModule, 'isFirefoxProfileDirectory');
  const readdirMock = deepMocked(readdir);

  const props = mockProps<typeof scanFirefoxProfiles>({
    ctx: {} as CleanerContext,
    firefoxProfilesDir: '/home/user/.mozilla/firefox',
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

  it('should return empty array when no entries found in profiles directory', async () => {
    // Given
    readdirMock.mockResolvedValue([]);
    // When
    const result = await scanFirefoxProfiles(props);
    // Then
    expect(result).toEqual([]);
    expect(readdirMock).toBeCalledWith(props.firefoxProfilesDir);
    expect(mockedIsFirefoxProfileDirectory).not.toBeCalled();
    expect(mockedScanDirectory).not.toBeCalled();
  });

  it('should scan valid Firefox profile directories', async () => {
    // Given
    const profileEntries = ['rwt14re6.default', 'abc123.test-profile', 'Crash Reports', 'Pending Pings'] as unknown as Dirent<Buffer>[];
    const profileItems = [
      createMockItem('cookies.sqlite', 1024, '/home/user/.mozilla/firefox/rwt14re6.default'),
      createMockItem('webappsstore.sqlite', 2048, '/home/user/.mozilla/firefox/abc123.test-profile'),
    ];
    readdirMock.mockResolvedValue(profileEntries);
    mockedIsFirefoxProfileDirectory
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(false);

    mockedScanDirectory.mockResolvedValueOnce([profileItems[0]]).mockResolvedValueOnce([profileItems[1]]);
    // When
    const result = await scanFirefoxProfiles(props);
    // Then
    expect(result).toEqual(profileItems);
    expect(readdirMock).toBeCalledWith(props.firefoxProfilesDir);
    expect(mockedIsFirefoxProfileDirectory).toBeCalledTimes(4);
    expect(mockedIsFirefoxProfileDirectory).toBeCalledWith('rwt14re6.default', props.firefoxProfilesDir);
    expect(mockedIsFirefoxProfileDirectory).toBeCalledWith('abc123.test-profile', props.firefoxProfilesDir);
    expect(mockedScanDirectory).toBeCalledTimes(2);
  });

  it('should call scanDirectory with correct parameters for each profile', async () => {
    // Given
    const profileEntries = ['profile1.default'] as unknown as Dirent<Buffer>[];
    readdirMock.mockResolvedValue(profileEntries);
    mockedIsFirefoxProfileDirectory.mockResolvedValue(true);
    mockedScanDirectory.mockResolvedValue([]);
    // When
    await scanFirefoxProfiles(props);
    // Then
    expect(mockedScanDirectory).toBeCalledWith({
      ctx: props.ctx,
      dirPath: expect.stringContaining('profile1.default'),
      customFileFilter: expect.any(Function),
    });
  });

  it('should handle Promise.allSettled rejections gracefully for profile directory checks', async () => {
    // Given
    const profileEntries = ['profile1.default', 'profile2.test'] as unknown as Dirent<Buffer>[];
    readdirMock.mockResolvedValue(profileEntries);
    mockedIsFirefoxProfileDirectory.mockRejectedValueOnce(new Error('Permission denied')).mockResolvedValueOnce(true);
    mockedScanDirectory.mockResolvedValue([]);
    // When
    const result = await scanFirefoxProfiles(props);
    // Then
    expect(result).toEqual([]);
    expect(mockedScanDirectory).toBeCalledTimes(1);
    expect(mockedScanDirectory).toBeCalledWith({
      ctx: props.ctx,
      dirPath: expect.stringContaining('profile2.test'),
      customFileFilter: expect.any(Function),
    });
  });

  it('should handle Promise.allSettled rejections gracefully for scan operations', async () => {
    // Given
    const profileEntries = ['profile1.default', 'profile2.test'] as unknown as Dirent<Buffer>[];
    const successItems = [createMockItem('success.sqlite', 1024, '/home/user/.mozilla/firefox/profile2.test')];
    readdirMock.mockResolvedValue(profileEntries);
    mockedIsFirefoxProfileDirectory.mockResolvedValue(true);
    mockedScanDirectory.mockRejectedValueOnce(new Error('Permission denied')).mockResolvedValueOnce(successItems);
    // When
    const result = await scanFirefoxProfiles(props);
    // Then
    expect(result).toEqual(successItems);
    expect(mockedScanDirectory).toBeCalledTimes(2);
  });

  it('should silently ignore errors when reading profiles directory', async () => {
    // Given
    readdirMock.mockRejectedValue(new Error('Directory not found'));
    // When
    const result = await scanFirefoxProfiles(props);
    // Then
    expect(result).toEqual([]);
    expect(readdirMock).toBeCalledWith(props.firefoxProfilesDir);
    expect(mockedIsFirefoxProfileDirectory).not.toBeCalled();
    expect(mockedScanDirectory).not.toBeCalled();
  });

  describe('firefoxStorageFileFilter', () => {
    it('should exclude storage files and include regular files', async () => {
      // Given
      const profileEntries = ['profile.default'] as unknown as Dirent<Buffer>[];
      readdirMock.mockResolvedValue(profileEntries);
      mockedIsFirefoxProfileDirectory.mockResolvedValue(true);
      let capturedFilter: ((args: { ctx: CleanerContext; fileName: string }) => boolean) | undefined;
      mockedScanDirectory.mockImplementation(({ customFileFilter }) => {
        capturedFilter = customFileFilter;
        return Promise.resolve([]);
      });
      // When
      await scanFirefoxProfiles(props);
      // Then
      expect(capturedFilter).toBeDefined();
      if (capturedFilter) {
        expect(capturedFilter({ ctx: props.ctx, fileName: 'cookies.sqlite' })).toBe(false);
        expect(capturedFilter({ ctx: props.ctx, fileName: 'webappsstore.sqlite3' })).toBe(false);
        expect(capturedFilter({ ctx: props.ctx, fileName: 'chromeappsstore.db' })).toBe(false);
        expect(capturedFilter({ ctx: props.ctx, fileName: 'session.sqlite' })).toBe(false);
        expect(capturedFilter({ ctx: props.ctx, fileName: 'regular-file.txt' })).toBe(true);
        expect(capturedFilter({ ctx: props.ctx, fileName: 'prefs.js' })).toBe(true);
        expect(capturedFilter({ ctx: props.ctx, fileName: 'bookmarks.html' })).toBe(true);
      }
    });
  });
});
