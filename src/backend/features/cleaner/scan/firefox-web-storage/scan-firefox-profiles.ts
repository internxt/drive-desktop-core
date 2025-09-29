import { readdir } from 'node:fs/promises';
import { join } from 'node:path/posix';

import { scanDirectory } from '../../scan/scan-directory';
import { CleanableItem, CleanerContext } from '../../types/cleaner.types';
import { isFirefoxProfileDirectory } from '../../utils/is-firefox-profile-directory';
import { isSafeWebBrowserFile } from '../../utils/is-safe-web-browser-file';

type Props = {
  ctx: CleanerContext;
};

export async function scanFirefoxProfiles({ ctx }: Props) {
  const firefoxProfilesDir = ctx.browser.paths.storage.firefoxProfile;
  let entries: string[];
  try {
    entries = await readdir(firefoxProfilesDir);
  } catch {
    return [];
  }

  const profileDirsChecks = await Promise.allSettled(
    entries.map(async (entry) => {
      const isProfileDir = await isFirefoxProfileDirectory({ entry, parentPath: firefoxProfilesDir });
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
    const profilePath = join(firefoxProfilesDir, profileDir);

    scanPromises.push(
      scanDirectory({
        ctx,
        dirPath: profilePath,
        customFileFilter: isSafeWebBrowserFile,
      }),
    );
  }

  const results = await Promise.allSettled(scanPromises);
  return results.filter((result) => result.status === 'fulfilled').flatMap((result) => result.value);
}
