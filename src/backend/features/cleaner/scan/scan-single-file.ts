import { promises as fs } from 'fs';

import { logger } from '@/backend/core/logger/logger';

import { createCleanableItem } from '../utils/create-cleanable-item';
import { wasAccessedWithinLastHour } from '../utils/was-accessed-within-last-hour';

export async function scanSingleFile({ filePath }: { filePath: string }) {
  try {
    const fileStats = await fs.stat(filePath);

    const wasAccessed = wasAccessedWithinLastHour({ fileStats });
    if (!fileStats.isFile() || wasAccessed) {
      return [];
    }

    const item = createCleanableItem({ filePath, stat: fileStats });
    return [item];
  } catch {
    logger.warn({
      tag: 'CLEANER',
      msg: `Single file cannot be accessed, skipping`,
      filePath,
    });
  }

  return [];
}
