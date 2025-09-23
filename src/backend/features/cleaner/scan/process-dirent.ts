import { Dirent } from 'fs';

import { logger } from '@/backend/core/logger/logger';

import { createCleanableItem } from '../utils/create-cleanable-item';
import { wasAccessedWithinLastHour } from '../utils/was-accessed-within-last-hour';
import { scanDirectory } from './scan-directory';

type ProcessDirentProps = {
  entry: Dirent;
  fullPath: string;
  customDirectoryFilter?: (directoryName: string) => boolean;
  customFileFilter?: ({ fileName }: { fileName: string }) => boolean;
};

export async function processDirent({ entry, fullPath, customFileFilter, customDirectoryFilter }: ProcessDirentProps) {
  try {
    if (entry.isFile()) {
      if (
        (await wasAccessedWithinLastHour({ filePath: fullPath })) ||
        (customFileFilter && customFileFilter({ fileName: entry.name }))
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
