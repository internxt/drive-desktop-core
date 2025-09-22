import checkDiskSpace from 'check-disk-space';

import { logger } from '@/backend/core/logger/logger';

export async function getDiskSpace() {
  try {
    const basePath = process.platform === 'win32' ? 'C:\\' : '/';
    const { size } = await checkDiskSpace(basePath);
    return size;
  } catch (error) {
    logger.error({ msg: 'Failed to get disk space', error });
    return 0;
  }
}
