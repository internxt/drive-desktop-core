import { readdir } from 'fs/promises';
import { join } from 'path';

import { scanDirectory } from '../../scan/scan-directory';
import { CleanableItem, CleanerContext } from '../../types/cleaner.types';
import { isFirefoxProfileDirectory } from '../../utils/is-firefox-profile-directory';
import { webBrowserFileFilter } from '../../utils/web-browser-file-filter';

type Props = {
  ctx: CleanerContext;
  firefoxCacheDir: string;
};
export async function scanFirefoxCacheProfiles({ ctx, firefoxCacheDir }: Props) {
  const items: CleanableItem[] = [];

  try {
    const entries = await readdir(firefoxCacheDir);

    const profileDirsChecks = await Promise.allSettled(
      entries.map(async (entry) => {
        const isProfileDir = await isFirefoxProfileDirectory(entry, firefoxCacheDir);
        return { entry, isProfileDir };
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
      const profileCachePath = join(firefoxCacheDir, profileDir);

      const cache2Path = join(profileCachePath, 'cache2');
      scanPromises.push(
        scanDirectory({
          ctx,
          dirPath: cache2Path,
          customFileFilter: webBrowserFileFilter,
        }),
      );

      const thumbnailsPath = join(profileCachePath, 'thumbnails');
      scanPromises.push(
        scanDirectory({
          ctx,
          dirPath: thumbnailsPath,
          customFileFilter: webBrowserFileFilter,
        }),
      );

      const startupCachePath = join(profileCachePath, 'startupCache');
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
  } catch {
    /**
     * v.0.1.1
     * Alexis Mora
     * Silently ignore errors when scanning Firefox cache profiles
     * This handles cases where profiles don't exist or are inaccessible
     */
  }

  return items;
}
