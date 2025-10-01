import { unlink } from 'node:fs/promises';

import { logger } from '@/backend/core/logger/logger';
import { FileSystemModule } from '@/backend/infra/file-system/file-system.module';
import { AbsolutePath } from '@/backend/infra/file-system/file-system.types';

import { cleanerStore } from '../stores/cleaner.store';

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
      return;
    }

    const fileSize = data.size;
    await unlink(absolutePath);

    cleanerStore.state.deletedFilesCount++;
    cleanerStore.state.totalSpaceGained += fileSize;
  } catch (error) {
    logger.warn({
      msg: 'Failed to delete file, continuing with next file',
      absolutePath,
      error,
    });
  }
}
