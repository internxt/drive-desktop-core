import { stat, readdir } from 'node:fs/promises';
import { join } from 'node:path/posix';

import { logger } from '@/backend/core/logger/logger';

import { CleanableItem, CleanerContext } from '../types/cleaner.types';
import { isInternxtRelated } from '../utils/is-file-internxt-related';
import { processDirent } from './process-dirent';

type Props = {
  ctx: CleanerContext;
  absolutePath: string;
  customFileFilter?: ({ ctx, fileName }: { ctx: CleanerContext; fileName: string }) => boolean;
  customDirectoryFilter?: ({ folderName }: { folderName: string }) => boolean;
};

export async function scanDirectory({ ctx, absolutePath, customFileFilter, customDirectoryFilter }: Props) {
  try {
    const folderStats = await stat(absolutePath);
    if (!folderStats.isDirectory()) {
      return [];
    }

    const dirents = await readdir(absolutePath, { withFileTypes: true });
    const items: CleanableItem[] = [];

    for (const dirent of dirents) {
      const fullPath = join(absolutePath, dirent.name);
      if (isInternxtRelated({ name: fullPath })) continue;

      const cleanableItems = await processDirent({
        ctx,
        entry: dirent,
        absolutePath,
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
      absolutePath,
      error,
    });
  }

  return [];
}
