import { Dirent, promises as fs } from 'fs';

import { mockProps, partialSpyOn, deepMocked } from '@/tests/vitest/utils.helper.test';

import * as scanDirectoryModule from '../../scan/scan-directory';
import { CleanableItem, CleanerContext } from '../../types/cleaner.types';
import * as isFirefoxProfileDirectoryModule from '../../utils/is-firefox-profile-directory';
import { scanFirefoxProfiles } from './scan-firefox-profiles';

vi.mock(import('fs'));

describe('scanFirefoxProfiles', () => {
  const mockedScanDirectory = partialSpyOn(scanDirectoryModule, 'scanDirectory');
  const mockedIsFirefoxProfileDirectory = partialSpyOn(isFirefoxProfileDirectoryModule, 'isFirefoxProfileDirectory');
  const readdirMock = deepMocked(fs.readdir);

  const mockContext = mockProps<typeof scanFirefoxProfiles>({
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
    const result = await scanFirefoxProfiles(mockContext);
    // Then
    expect(result).toEqual([]);
    expect(readdirMock).toHaveBeenCalledWith(mockContext.firefoxProfilesDir);
    expect(mockedIsFirefoxProfileDirectory).not.toHaveBeenCalled();
    expect(mockedScanDirectory).not.toHaveBeenCalled();
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
    const result = await scanFirefoxProfiles(mockContext);
    // Then
    expect(result).toEqual(profileItems);
    expect(readdirMock).toHaveBeenCalledWith(mockContext.firefoxProfilesDir);
    expect(mockedIsFirefoxProfileDirectory).toHaveBeenCalledTimes(4);
    expect(mockedIsFirefoxProfileDirectory).toHaveBeenCalledWith('rwt14re6.default', mockContext.firefoxProfilesDir);
    expect(mockedIsFirefoxProfileDirectory).toHaveBeenCalledWith('abc123.test-profile', mockContext.firefoxProfilesDir);
    expect(mockedScanDirectory).toHaveBeenCalledTimes(2);
  });

  it('should call scanDirectory with correct parameters for each profile', async () => {
    // Given
    const profileEntries = ['profile1.default'];
    readdirMock.mockResolvedValue(profileEntries as any);
    mockedIsFirefoxProfileDirectory.mockResolvedValue(true);
    mockedScanDirectory.mockResolvedValue([]);
    // When
    await scanFirefoxProfiles(mockContext);
    // Then
    expect(mockedScanDirectory).toHaveBeenCalledWith({
      ctx: mockContext.ctx,
      dirPath: expect.stringContaining('profile1.default'),
      customFileFilter: expect.any(Function),
    });
  });

  it('should handle Promise.allSettled rejections gracefully for profile directory checks', async () => {
    // Given
    const profileEntries = ['profile1.default', 'profile2.test'];
    readdirMock.mockResolvedValue(profileEntries as any);
    mockedIsFirefoxProfileDirectory.mockRejectedValueOnce(new Error('Permission denied')).mockResolvedValueOnce(true);
    mockedScanDirectory.mockResolvedValue([]);
    // When
    const result = await scanFirefoxProfiles(mockContext);
    // Then
    expect(result).toEqual([]);
    expect(mockedScanDirectory).toHaveBeenCalledTimes(1);
    expect(mockedScanDirectory).toHaveBeenCalledWith({
      ctx: mockContext.ctx,
      dirPath: expect.stringContaining('profile2.test'),
      customFileFilter: expect.any(Function),
    });
  });

  it('should handle Promise.allSettled rejections gracefully for scan operations', async () => {
    // Given
    const profileEntries = ['profile1.default', 'profile2.test'];
    const successItems = [createMockItem('success.sqlite', 1024, '/home/user/.mozilla/firefox/profile2.test')];
    readdirMock.mockResolvedValue(profileEntries as any);
    mockedIsFirefoxProfileDirectory.mockResolvedValue(true);
    mockedScanDirectory.mockRejectedValueOnce(new Error('Permission denied')).mockResolvedValueOnce(successItems);
    // When
    const result = await scanFirefoxProfiles(mockContext);
    // Then
    expect(result).toEqual(successItems);
    expect(mockedScanDirectory).toHaveBeenCalledTimes(2);
  });

  it('should silently ignore errors when reading profiles directory', async () => {
    // Given
    readdirMock.mockRejectedValue(new Error('Directory not found'));
    // When
    const result = await scanFirefoxProfiles(mockContext);
    // Then
    expect(result).toEqual([]);
    expect(readdirMock).toHaveBeenCalledWith(mockContext.firefoxProfilesDir);
    expect(mockedIsFirefoxProfileDirectory).not.toHaveBeenCalled();
    expect(mockedScanDirectory).not.toHaveBeenCalled();
  });

  describe('firefoxStorageFileFilter', () => {
    it('should exclude storage files and include regular files', async () => {
      // Given
      const profileEntries = ['profile.default'];
      readdirMock.mockResolvedValue(profileEntries as any);
      mockedIsFirefoxProfileDirectory.mockResolvedValue(true);
      let capturedFilter: ((args: { fileName: string }) => boolean) | undefined;
      mockedScanDirectory.mockImplementation(({ customFileFilter }) => {
        capturedFilter = customFileFilter as any;
        return Promise.resolve([]);
      });
      // When
      await scanFirefoxProfiles(mockContext);
      // Then
      expect(capturedFilter).toBeDefined();
      if (capturedFilter) {
        expect(capturedFilter({ fileName: 'cookies.sqlite' })).toBe(false);
        expect(capturedFilter({ fileName: 'webappsstore.sqlite3' })).toBe(false);
        expect(capturedFilter({ fileName: 'chromeappsstore.db' })).toBe(false);
        expect(capturedFilter({ fileName: 'session.sqlite' })).toBe(false);
        expect(capturedFilter({ fileName: 'regular-file.txt' })).toBe(true);
        expect(capturedFilter({ fileName: 'prefs.js' })).toBe(true);
        expect(capturedFilter({ fileName: 'bookmarks.html' })).toBe(true);
      }
    });
  });
});
