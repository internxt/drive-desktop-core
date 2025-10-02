import { join } from 'node:path/posix';

import { logger } from '@/backend/core/logger/logger';
import { AbsolutePath } from '@/backend/infra/file-system/file-system.types';

import { CleanerContext } from '../types/cleaner.types';
import { getFilteredDirectories } from '../utils/get-filtered-directories';
import { scanDirectory } from './scan-directory';

type Props = {
  ctx: CleanerContext;
  baseDir: AbsolutePath;
  subPath: string;
  customDirectoryFilter?: ({ folderName }: { folderName: string }) => boolean;
  customFileFilter?: ({ ctx, fileName }: { ctx: CleanerContext; fileName: string }) => boolean;
};

export async function scanSubDirectory({ ctx, baseDir, subPath, customDirectoryFilter, customFileFilter }: Props) {
  try {
    const directories = await getFilteredDirectories({ baseDir, customDirectoryFilter });

    const scanPromises = directories.map((directory) => {
      const dirPath = join(baseDir, directory.name, subPath) as AbsolutePath;
      return scanDirectory({
        ctx,
        absolutePath: dirPath,
        customFileFilter,
      });
    });

    const results = await Promise.allSettled(scanPromises);

    return results.filter((result) => result.status === 'fulfilled').flatMap((result) => result.value);
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
