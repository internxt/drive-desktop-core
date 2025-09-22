import { CleanableItem } from '../types/cleaner.types';
import { promises as fs } from 'fs';
import path from 'path';
import { isInternxtRelated } from '../utils/is-file-internxt-related';
import { scanDirectory } from './scan-directory';
import { logger } from '@/backend/core/logger/logger';

async function getFilteredDirectories(
  baseDir: string,
  customDirectoryFiler?: (directoryName: string) => boolean
) {
  return await fs
    .readdir(baseDir, { withFileTypes: true })
    .then((dirents) =>
      dirents.filter(
        (dirent) =>
          dirent.isDirectory() &&
          !isInternxtRelated(dirent.name) &&
          (!customDirectoryFiler || !customDirectoryFiler(dirent.name))
      )
    );
}

type ScanSubDirectoryProps = {
  baseDir: string;
  subPath: string;
  customDirectoryFilter?: (directoryName: string) => boolean;
  customFileFilter?: (fileName: string) => boolean;
};

export async function scanSubDirectory({
  baseDir,
  subPath,
  customDirectoryFilter,
  customFileFilter,
}: ScanSubDirectoryProps): Promise<CleanableItem[]> {
  const cleanableItems: CleanableItem[] = [];
  try {
    const directories = await getFilteredDirectories(
      baseDir,
      customDirectoryFilter
    );

    const scanPromises = directories.map((directory) => {
      const dirPath = path.join(baseDir, directory.name, subPath);
      return scanDirectory({
        dirPath,
        customFileFilter,
      });
    });

    const results = await Promise.allSettled(scanPromises);

    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        cleanableItems.push(...result.value);
      }
    });
  } catch (error) {
    logger.warn({
      msg: `[CLEANER] Directory ${subPath} within ${baseDir} might not exist or be accesible, skipping it`,
    });
  }

  return cleanableItems;
}
