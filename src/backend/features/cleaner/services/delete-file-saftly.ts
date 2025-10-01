import { unlink } from 'node:fs/promises';

import { logger } from '@/backend/core/logger/logger';
import { FileSystemModule } from '@/backend/infra/file-system/file-system.module';
import { AbsolutePath } from '@/backend/infra/file-system/file-system.types';

type Props = {
  absolutePath: AbsolutePath;
};

export async function deleteFileSafely({ absolutePath }: Props) {
  try {
    const { data, error } = await FileSystemModule.stat({ absolutePath });
    if (error) {
      logger.warn({
        tag: 'CLEANER',
        msg: 'Failed to delete file, could not retrieve file stats',
        filePath: absolutePath,
      });
      return { success: false, size: 0 };
    }

    const fileSize = data.size;
    await unlink(absolutePath);

    return { success: true, size: fileSize };
  } catch (error) {
    logger.warn({
      msg: 'Failed to delete file, continuing with next file',
      absolutePath,
      error: error instanceof Error ? error.message : String(error),
    });
    return { success: false, size: 0 };
  }
}
