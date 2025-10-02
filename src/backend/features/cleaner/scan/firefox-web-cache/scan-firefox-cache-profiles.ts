import { Dirent } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path/posix';

import { AbsolutePath } from '@/backend/infra/file-system/file-system.types';

import { scanDirectory } from '../../scan/scan-directory';
import { CleanableItem, CleanerContext } from '../../types/cleaner.types';
import { isFirefoxProfileDirectory } from '../../utils/is-firefox-profile-directory';
import { isSafeWebBrowserFile } from '../../utils/is-safe-web-browser-file';

type Props = {
  ctx: CleanerContext;
  firefoxCacheDir: AbsolutePath;
};

export async function scanFirefoxCacheProfiles({ ctx, firefoxCacheDir }: Props) {

  let entries: Dirent[];
  try {
    entries = await readdir(firefoxCacheDir, { withFileTypes: true });
  } catch {
    return [];
  }

  const profileDirsChecks = entries.map((entry) => {
    const isProfileDir = isFirefoxProfileDirectory({ entry, parentPath: firefoxCacheDir });
    return { entry, isProfileDir };
  });

  const profileDirs = profileDirsChecks.filter((result) => result.isProfileDir).map((result) => result.entry.name);

  const scanPromises: Promise<CleanableItem[]>[] = [];

  for (const profileDir of profileDirs) {
    const profileCachePath = join(firefoxCacheDir, profileDir);

    const cache2Path = join(profileCachePath, 'cache2') as AbsolutePath;
    scanPromises.push(
      scanDirectory({
        ctx,
        absolutePath: cache2Path,
        customFileFilter: isSafeWebBrowserFile,
      }),
    );

    const thumbnailsPath = join(profileCachePath, 'thumbnails') as AbsolutePath;
    scanPromises.push(
      scanDirectory({
        ctx,
        absolutePath: thumbnailsPath,
        customFileFilter: isSafeWebBrowserFile,
      }),
    );

    const startupCachePath = join(profileCachePath, 'startupCache') as AbsolutePath;
    scanPromises.push(
      scanDirectory({
        ctx,
        absolutePath: startupCachePath,
        customFileFilter: isSafeWebBrowserFile,
      }),
    );
  }

  const results = await Promise.allSettled(scanPromises);
  return results.filter((result) => result.status === 'fulfilled').flatMap((result) => result.value);
}
