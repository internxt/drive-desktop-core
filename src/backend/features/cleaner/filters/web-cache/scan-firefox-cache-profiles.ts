import { promises as fs } from 'fs';
import path from 'path';

import { CleanableItem, CleanerContext } from '../../types/cleaner.types';
import { scanDirectory } from '../../scan/scan-directory';
import { isFirefoxProfileDirectory } from '../../utils/is-firefox-profile-directory';
import { webBrowserFileFilter } from '../../utils/is-safe-web-browser-file';

export async function scanFirefoxCacheProfiles({ ctx, firefoxCacheDir }: { ctx: CleanerContext; firefoxCacheDir: string }): Promise<CleanableItem[]> {
  const items: CleanableItem[] = [];

  try {
    const entries = await fs.readdir(firefoxCacheDir);

    const profileDirsChecks = await Promise.allSettled(
      entries.map(async (entry) => {
        const isProfileDir = await isFirefoxProfileDirectory(entry, firefoxCacheDir);
        return { entry: entry, isProfileDir };
      }),
    );

    const profileDirs = profileDirsChecks
      .filter(
        (
          result,
        ): result is PromiseFulfilledResult<{
          entry: string;
          isProfileDir: boolean;
        }> => result.status === 'fulfilled' && result.value.isProfileDir,
      )
      .map((result) => result.value.entry);

    const scanPromises: Promise<CleanableItem[]>[] = [];

    for (const profileDir of profileDirs) {
      const profileCachePath = path.join(firefoxCacheDir, profileDir);

      const cache2Path = path.join(profileCachePath, 'cache2');
      scanPromises.push(
        scanDirectory({
          ctx,
          dirPath: cache2Path,
          customFileFilter: webBrowserFileFilter,
        }),
      );

      const thumbnailsPath = path.join(profileCachePath, 'thumbnails');
      scanPromises.push(
        scanDirectory({
          ctx,
          dirPath: thumbnailsPath,
          customFileFilter: webBrowserFileFilter,
        }),
      );

      const startupCachePath = path.join(profileCachePath, 'startupCache');
      scanPromises.push(
        scanDirectory({
          ctx,
          dirPath: startupCachePath,
          customFileFilter: webBrowserFileFilter,
        }),
      );
    }

    const results = await Promise.allSettled(scanPromises);
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        items.push(...result.value);
      }
    });
  } catch (error) {
    /**
     * v.2.5.0
     * Alexis Mora
     * Silently ignore errors when scanning Firefox cache profiles
     * This handles cases where profiles don't exist or are inaccessible
     */
  }

  return items;
}
