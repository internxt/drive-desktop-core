import { Dirent } from 'node:fs';
import { readdir } from 'node:fs/promises';

import { mockProps, partialSpyOn, deepMocked } from '@/tests/vitest/utils.helper.test';

import * as scanDirectoryModule from '../../scan/scan-directory';
import { CleanableItem } from '../../types/cleaner.types';
import * as isFirefoxProfileDirectoryModule from '../../utils/is-firefox-profile-directory';
import { scanFirefoxCacheProfiles } from './scan-firefox-cache-profiles';

vi.mock(import('node:fs/promises'));

describe('scanFirefoxCacheProfiles', () => {
  const firefoxCacheDir = '/home/user/.cache/mozilla/firefox';
  const mockedScanDirectory = partialSpyOn(scanDirectoryModule, 'scanDirectory');
  const mockedIsFirefoxProfileDirectory = partialSpyOn(isFirefoxProfileDirectoryModule, 'isFirefoxProfileDirectory');
  const readdirMock = deepMocked(readdir);

  const createMockItem = (fileName: string, size: number, basePath: string): CleanableItem => ({
    fullPath: `${basePath}/${fileName}`,
    fileName,
    sizeInBytes: size,
  });

  let props: Parameters<typeof scanFirefoxCacheProfiles>[0];

  beforeEach(() => {
    mockedScanDirectory.mockResolvedValue([]);
    mockedIsFirefoxProfileDirectory.mockResolvedValue(false);
    readdirMock.mockResolvedValue([]);
    props = mockProps<typeof scanFirefoxCacheProfiles>({
      ctx: {
        browser: {
          paths: {
            cache: {
              firefoxCacheDir,
            },
          },
        },
      },
    });
  });

  it('should return empty array when no entries found in cache directory', async () => {
    // Given/When
    const result = await scanFirefoxCacheProfiles(props);
    // Then
    expect(result).toEqual([]);
    expect(readdirMock).toBeCalledWith(firefoxCacheDir);
    expect(mockedIsFirefoxProfileDirectory).not.toBeCalled();
    expect(mockedScanDirectory).not.toBeCalled();
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
    const result = await scanFirefoxCacheProfiles(props);
    // Then
    expect(result).toStrictEqual(cacheItems);
    expect(readdirMock).toBeCalledWith(firefoxCacheDir);
    expect(mockedIsFirefoxProfileDirectory).toBeCalledTimes(4);
    expect(mockedScanDirectory).toBeCalledTimes(3);
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
    const result = await scanFirefoxCacheProfiles(props);
    // Then
    expect(result).toStrictEqual([...profile1Items, ...profile2Items]);
    expect(mockedScanDirectory).toBeCalledTimes(6);
  });
});
