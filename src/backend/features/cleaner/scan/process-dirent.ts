import { Dirent } from 'fs';

import { logger } from '@/backend/core/logger/logger';

import { createCleanableItem } from '../utils/create-cleanable-item';
import { wasAccessedWithinLastHour } from '../utils/was-accessed-within-last-hour';
import { scanDirectory } from './scan-directory';
import { CleanerContext } from '../types/cleaner.types';

type ProcessDirentProps = {
  ctx: CleanerContext;
  entry: Dirent;
  fullPath: string;
  customDirectoryFilter?: (directoryName: string) => boolean;
  customFileFilter?: ({ ctx, fileName }: { ctx: CleanerContext; fileName: string }) => boolean;
};

export async function processDirent({ ctx, entry, fullPath, customFileFilter, customDirectoryFilter }: ProcessDirentProps) {
  try {
    if (entry.isFile()) {
      if (
        (await wasAccessedWithinLastHour({ filePath: fullPath })) ||
        (customFileFilter && !customFileFilter({ ctx, fileName: entry.name }))
      ) {
        return [];
      }

      const item = await createCleanableItem({ filePath: fullPath });
      return [item];
    } else if (entry.isDirectory()) {
      if (customDirectoryFilter && customDirectoryFilter(entry.name)) {
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
      msg: `File or Directory with path ${fullPath} cannot be accessed, skipping`,
    });
  }

  return [];
}
