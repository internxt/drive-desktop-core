import { Dirent } from 'node:fs';
import { stat } from 'node:fs/promises';

import { logger } from '@/backend/core/logger/logger';
import { AbsolutePath } from '@/backend/infra/file-system/file-system.types';

import { CleanerContext } from '../types/cleaner.types';
import { createCleanableItem } from '../utils/create-cleanable-item';
import { wasAccessedWithinLastHour } from '../utils/was-accessed-within-last-hour';
import { scanDirectory } from './scan-directory';

type Props = {
  ctx: CleanerContext;
  entry: Dirent;
  absolutePath: AbsolutePath;
  customDirectoryFilter?: ({ folderName }: { folderName: string }) => boolean;
  customFileFilter?: ({ ctx, fileName }: { ctx: CleanerContext; fileName: string }) => boolean;
};

export async function processDirent({ ctx, entry, absolutePath, customFileFilter, customDirectoryFilter }: Props) {
  try {
    if (entry.isFile()) {
      const fileStats = await stat(absolutePath);
      const wasAccessed = wasAccessedWithinLastHour({ fileStats });
      const shouldInclude = customFileFilter?.({ ctx, fileName: entry.name }) ?? true;

      if (wasAccessed || !shouldInclude) {
        return [];
      }

      const item = createCleanableItem({ absolutePath, stat: fileStats });
      return [item];
    } else if (entry.isDirectory()) {
      const isFiltered = customDirectoryFilter?.({ folderName: entry.name }) || false;

      if (isFiltered) {
        return [];
      }

      return await scanDirectory({
        ctx,
        absolutePath,
        customFileFilter,
        customDirectoryFilter,
      });
    }
  } catch {
    logger.warn({
      tag: 'CLEANER',
      msg: 'File or folder with path cannot be accessed, skipping',
      absolutePath,
    });
  }

  return [];
}
