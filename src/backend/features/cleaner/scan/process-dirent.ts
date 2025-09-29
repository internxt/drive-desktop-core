import { Dirent, promises as fs } from 'node:fs';

import { logger } from '@/backend/core/logger/logger';

import { CleanerContext } from '../types/cleaner.types';
import { createCleanableItem } from '../utils/create-cleanable-item';
import { wasAccessedWithinLastHour } from '../utils/was-accessed-within-last-hour';
import { scanDirectory } from './scan-directory';

type Props = {
  ctx: CleanerContext;
  entry: Dirent;
  fullPath: string;
  customDirectoryFilter?: ({ folderName }: { folderName: string }) => boolean;
  customFileFilter?: ({ ctx, fileName }: { ctx: CleanerContext; fileName: string }) => boolean;
};

export async function processDirent({ ctx, entry, fullPath, customFileFilter, customDirectoryFilter }: Props) {
  try {
    if (entry.isFile()) {
      const fileStats = await fs.stat(fullPath);
      const wasAccessed = wasAccessedWithinLastHour({ fileStats });
      const isFiltered = customFileFilter && customFileFilter({ ctx, fileName: entry.name });

      if (wasAccessed || isFiltered) {
        return [];
      }

      const item = createCleanableItem({ filePath: fullPath, stat: fileStats });
      return [item];
    } else if (entry.isDirectory()) {
      const isFiltered = customDirectoryFilter && customDirectoryFilter({ folderName: entry.name });

      if (isFiltered) {
        return [];
      }

      return await scanDirectory({
        ctx,
        dirPath: fullPath,
        customFileFilter,
        customDirectoryFilter,
      });
    }
  } catch {
    logger.warn({
      tag: 'CLEANER',
      msg: 'File or folder with path cannot be accessed, skipping',
      fullPath,
    });
  }

  return [];
}
