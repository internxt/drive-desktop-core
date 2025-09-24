import { promises as fs } from 'fs';
import path from 'path';

import { logger } from '@/backend/core/logger/logger';

import { CleanableItem } from '../types/cleaner.types';
import { isInternxtRelated } from '../utils/is-file-internxt-related';
import { scanDirectory } from './scan-directory';

type FilterDirectoriesProps = {
  baseDir: string;
  customDirectoryFilter?: (directoryName: string) => boolean;
};

async function getFilteredDirectories({ baseDir, customDirectoryFilter }: FilterDirectoriesProps) {
  return await fs
    .readdir(baseDir, { withFileTypes: true })
    .then((dirents) =>
      dirents.filter(
        (dirent) =>
          dirent.isDirectory() &&
          !isInternxtRelated({ name: dirent.name }) &&
          (!customDirectoryFilter || !customDirectoryFilter(dirent.name)),
      ),
    );
}

type ScanSubDirectoryProps = {
  baseDir: string;
  subPath: string;
  customDirectoryFilter?: (directoryName: string) => boolean;
  customFileFilter?: ({ fileName }: { fileName: string }) => boolean;
};

export async function scanSubDirectory({ baseDir, subPath, customDirectoryFilter, customFileFilter }: ScanSubDirectoryProps) {
  const cleanableItems: CleanableItem[] = [];
  try {
    const directories = await getFilteredDirectories({ baseDir, customDirectoryFilter });

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
      error,
    });
    return [];
  }

  return cleanableItems;
}