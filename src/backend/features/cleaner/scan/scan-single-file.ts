import { promises as fs } from 'node:fs';

import { logger } from '@/backend/core/logger/logger';
import { AbsolutePath } from '@/backend/infra/file-system/file-system.types';

import { createCleanableItem } from '../utils/create-cleanable-item';
import { wasAccessedWithinLastHour } from '../utils/was-accessed-within-last-hour';

export async function scanSingleFile({ absolutePath }: { absolutePath: AbsolutePath }) {
  try {
    const fileStats = await fs.stat(absolutePath);

    if (!fileStats.isFile() || wasAccessedWithinLastHour({ fileStats })) {
      return [];
    }

    const item = createCleanableItem({ absolutePath, stat: fileStats });
    return [item];
  } catch {
    logger.warn({
      tag: 'CLEANER',
      msg: `Single file cannot be accessed, skipping`,
      absolutePath,
    });
  }

  return [];
}
