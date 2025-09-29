import { stat, readdir } from 'fs/promises';
import { join } from 'path/posix';

import { logger } from '@/backend/core/logger/logger';

import { CleanableItem, CleanerContext } from '../types/cleaner.types';
import { isInternxtRelated } from '../utils/is-file-internxt-related';
import { processDirent } from './process-dirent';

type Props = {
  ctx: CleanerContext;
  dirPath: string;
  customFileFilter?: ({ ctx, fileName }: { ctx: CleanerContext; fileName: string }) => boolean;
  customDirectoryFilter?: ({ folderName }: { folderName: string }) => boolean;
};

export async function scanDirectory({ ctx, dirPath, customFileFilter, customDirectoryFilter }: Props) {
  try {
    const folderStats = await stat(dirPath);
    if (!folderStats.isDirectory()) {
      return [];
    }

    const dirents = await readdir(dirPath, { withFileTypes: true });
    const items: CleanableItem[] = [];

    for (const dirent of dirents) {
      const fullPath = join(dirPath, dirent.name);
      if (isInternxtRelated({ name: fullPath })) continue;

      const cleanableItems = await processDirent({
        ctx,
        entry: dirent,
        fullPath,
        customFileFilter,
        customDirectoryFilter,
      });
      items.push(...cleanableItems);
    }

    return items;
  } catch (error) {
    logger.warn({
      tag: 'CLEANER',
      msg: 'Directory does not exist or cannot be accessed, skipping',
      dirPath,
      error,
    });
  }

  return [];
}
