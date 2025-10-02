import { unlink } from 'node:fs/promises';

import { logger } from '@/backend/core/logger/logger';
import { FileSystemModule } from '@/backend/infra/file-system/file-system.module';
import { AbsolutePath } from '@/backend/infra/file-system/file-system.types';
import { throwWrapper } from '@/backend/core/utils/throw-wrapper';

import { cleanerStore } from '../stores/cleaner.store';

type Props = {
  absolutePath: AbsolutePath;
};

export async function deleteFileSafely({ absolutePath }: Props) {
  try {
    const statsOrThrow = throwWrapper(FileSystemModule.stat);
    const data = await statsOrThrow({ absolutePath });

    const fileSize = data?.size;
    await unlink(absolutePath);

    cleanerStore.state.deletedFilesCount++;
    cleanerStore.state.totalSpaceGained += fileSize ?? 0;
  } catch (error) {
    logger.warn({
      tag: 'CLEANER',
      msg: 'Failed to delete file, continuing with next file',
      absolutePath,
      error,
    });
  }
}
