import { promises as fs } from 'fs';

import { logger } from '@/backend/core/logger/logger';

import { createCleanableItem } from '../utils/create-cleanable-item';
import { wasAccessedWithinLastHour } from '../utils/was-accessed-within-last-hour';

export async function scanSingleFile({ filePath }: { filePath: string }) {
  try {
    const stat = await fs.stat(filePath);

    if (!stat.isFile() || (await wasAccessedWithinLastHour({ filePath }))) {
      return [];
    }

    const item = await createCleanableItem({ filePath });
    return [item];
  } catch {
    logger.warn({
      msg: `Single file with file path ${filePath} cannot be accessed, skipping`,
    });
    return [];
  }
}
