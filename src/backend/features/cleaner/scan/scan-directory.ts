import { promises as fs } from 'fs';
import path from 'path';

import { logger } from '@/backend/core/logger/logger';

import { CleanableItem } from '../types/cleaner.types';
import { isInternxtRelated } from '../utils/is-file-internxt-related';
import { processDirent } from './process-dirent';

type ScanDirectoryProps = {
  dirPath: string;
  customFileFilter?: ({ fileName }: { fileName: string }) => boolean;
  customDirectoryFilter?: (folderName: string) => boolean;
};

export async function scanDirectory({ dirPath, customFileFilter, customDirectoryFilter }: ScanDirectoryProps) {
  try {
    const stat = await fs.stat(dirPath);
    if (!stat.isDirectory()) {
      return [];
    }

    const dirents = await fs.readdir(dirPath, { withFileTypes: true });
    const items: CleanableItem[] = [];

    for (const dirent of dirents) {
      const fullPath = path.join(dirPath, dirent.name);
      if (isInternxtRelated({ name: fullPath })) continue;

      const cleanableItems = await processDirent({
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
      msg: `Directory ${dirPath} does not exist or cannot be accessed, skipping`,
      error,
    });
    return [];
  }
}
