import { CleanableItem } from '../types/cleaner.types';
import { promises as fs } from 'fs';
import { wasAccessedWithinLastHour } from '../utils/was-accessed-within-last-hour';
import { createCleanableItem } from '../utils/create-cleanable-item';
import { logger } from '@/backend/core/logger/logger';

export async function scanSingleFile(
  filePath: string
): Promise<CleanableItem[]> {
  try {
    const stat = await fs.stat(filePath);

    if (!stat.isFile() || (await wasAccessedWithinLastHour(filePath))) {
      return [];
    }

    const item = await createCleanableItem(filePath);
    return [item];
  } catch (error) {
    logger.warn({
      msg: `Single file with file path ${filePath} cannot be accessed, skipping`,
    });
    return [];
  }
}
