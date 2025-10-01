import { logger } from '@/backend/core/logger/logger';
import { AbsolutePath } from '@/backend/infra/file-system/file-system.types';

import { CleanerViewModel, CleanupProgress, CleanerReport, CleanerSectionKey } from '../types/cleaner.types';
import { getAllItemsToDelete } from '../utils/selection-utils';
import { deleteFileSafely } from './delete-file-saftly';

let currentAbortController: AbortController | null = null;
let totalFilesToDelete = 0;
let deletedFilesCount = 0;
let totalSpaceGained = 0;

type Props = {
  viewModel: CleanerViewModel;
  storedCleanerReport: CleanerReport;
  emitProgress: (progress: CleanupProgress) => void;
  cleanerSectionKeys: CleanerSectionKey[];
};

export async function startCleanup({ viewModel, storedCleanerReport, emitProgress, cleanerSectionKeys }: Props) {
  if (currentAbortController) {
    logger.warn({ tag: 'CLEANER', msg: 'Cleanup already in progress, ignoring new request' });
    return;
  }

  if (!storedCleanerReport) {
    logger.error({ tag: 'CLEANER', msg: 'No cleaner report available. Generate a report first.' });
    return;
  }

  currentAbortController = new AbortController();
  deletedFilesCount = 0;
  totalSpaceGained = 0;

  const itemsToDelete = getAllItemsToDelete({ viewModel, report: storedCleanerReport, cleanerSectionKeys });
  totalFilesToDelete = itemsToDelete.length;

  logger.debug({
    tag: 'CLEANER',
    msg: 'Starting cleanup process',
    totalFiles: totalFilesToDelete,
  });

  emitProgress({
    currentCleaningPath: '',
    progress: 0,
    deletedFiles: 0,
    spaceGained: 0,
    cleaning: true,
    cleaningCompleted: false,
  });

  for (let i = 0; i < itemsToDelete.length; i++) {
    if (currentAbortController.signal.aborted) {
      logger.debug({ tag: 'CLEANER', msg: 'Cleanup process was aborted' });
      break;
    }

    const item = itemsToDelete[i];
    if (!item) return;
    // TODO: Cahnge type in getAllItemsToDelete
    const result = await deleteFileSafely({ absolutePath: item.fullPath as AbsolutePath });

    if (result.success) {
      deletedFilesCount++;
      totalSpaceGained += result.size;
    }

    const progress = Math.round(((i + 1) / totalFilesToDelete) * 100);
    emitProgress({
      currentCleaningPath: item.fileName,
      progress,
      deletedFiles: deletedFilesCount,
      spaceGained: totalSpaceGained,
      cleaning: true,
      cleaningCompleted: false,
    });
  }

  emitProgress({
    currentCleaningPath: '',
    progress: 100,
    deletedFiles: deletedFilesCount,
    spaceGained: totalSpaceGained,
    cleaning: false,
    cleaningCompleted: true,
  });

  logger.debug({
    tag: 'CLEANER',
    msg: 'Cleanup process finished',
    deletedFiles: deletedFilesCount,
    totalFiles: totalFilesToDelete,
  });

  currentAbortController = null;
}

export function stopCleanup(): void {
  if (!currentAbortController) {
    logger.warn({ tag: 'CLEANER', msg: 'No cleanup process to stop' });
    return;
  }

  logger.debug({ tag: 'CLEANER', msg: 'Stopping cleanup process' });
  currentAbortController.abort();
}
