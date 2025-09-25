import { Dirent } from 'fs';

import { logger } from '@/backend/core/logger/logger';

import { createCleanableItem } from '../utils/create-cleanable-item';
import { wasAccessedWithinLastHour } from '../utils/was-accessed-within-last-hour';
import { scanDirectory } from './scan-directory';

type Props = {
  entry: Dirent;
  fullPath: string;
  customDirectoryFilter?: ({ folderName }: { folderName: string }) => boolean;
  customFileFilter?: ({ fileName }: { fileName: string }) => boolean;
};

export async function processDirent({ entry, fullPath, customFileFilter, customDirectoryFilter }: Props) {
  try {
    if (entry.isFile()) {
      const wasAccessed = await wasAccessedWithinLastHour({ filePath: fullPath });
      const isFiltered = customFileFilter && customFileFilter({ fileName: entry.name });

      if (wasAccessed || isFiltered) {
        return [];
      }

      const item = await createCleanableItem({ filePath: fullPath });
      return [item];
    } else if (entry.isDirectory()) {
      const isFiltered = customDirectoryFilter && customDirectoryFilter({ folderName: entry.name });

      if (isFiltered) {
        return [];
      }

      return await scanDirectory({
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
