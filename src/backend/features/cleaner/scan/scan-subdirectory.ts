import path from 'path';

import { logger } from '@/backend/core/logger/logger';

import { getFilteredDirectories } from '../utils/get-filtered-directories';
import { scanDirectory } from './scan-directory';

type Props = {
  baseDir: string;
  subPath: string;
  customDirectoryFilter?: (directoryName: string) => boolean;
  customFileFilter?: ({ fileName }: { fileName: string }) => boolean;
};

export async function scanSubDirectory({ baseDir, subPath, customDirectoryFilter, customFileFilter }: Props) {
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

    return results
      .filter((result) => result.status === 'fulfilled')
      .map((result) => result.value)
      .flat();
  } catch (error) {
    logger.warn({
      tag: 'CLEANER',
      msg: `Directory might not exist or be accesible, skipping it`,
      baseDir,
      subPath,
      error,
    });
    return [];
  }
}
