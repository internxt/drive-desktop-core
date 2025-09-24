import { promises as fs } from 'fs';
import path from 'path';

import { CleanableItem, CleanerContext } from '../../types/cleaner.types';
import { scanDirectory } from '../../scan/scan-directory';
import { isFirefoxProfileDirectory } from '../../utils/is-firefox-profile-directory';


function firefoxStorageFileFilter({ fileName }: { fileName: string }): boolean {
  const lowerName = fileName.toLowerCase();

  const storageExtensions = ['.sqlite', '.sqlite3', '.db'];
  const isStorageFile = storageExtensions.some((ext) => lowerName.endsWith(ext));

  const storageFileNames = ['cookies', 'webappsstore', 'chromeappsstore'];
  const isStorageFileName = storageFileNames.some((name) => lowerName.includes(name));

  return !(isStorageFile || isStorageFileName);
}

export async function scanFirefoxProfiles({ ctx, firefoxProfilesDir }: { ctx: CleanerContext; firefoxProfilesDir: string }): Promise<CleanableItem[]> {
  const items: CleanableItem[] = [];

  try {
    const entries = await fs.readdir(firefoxProfilesDir);

    const profileDirsChecks = await Promise.allSettled(
      entries.map(async (entry) => {
        const isProfileDir = await isFirefoxProfileDirectory(entry, firefoxProfilesDir);
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
      const profilePath = path.join(firefoxProfilesDir, profileDir);

      scanPromises.push(
        scanDirectory({
          ctx,
          dirPath: profilePath,
          customFileFilter: firefoxStorageFileFilter,
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
     * Silently ignore errors when scanning Firefox profiles
     * This handles cases where profiles don't exist or are inaccessible
     */
  }

  return items;
}
