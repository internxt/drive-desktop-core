import { logger } from '@/backend/core/logger/logger';
import { AbsolutePath } from '@/backend/infra/file-system/file-system.types';

import { cleanerStore } from '../stores/cleaner.store';
import { CleanerViewModel, CleanupProgress, CleanerReport, CleanerSectionKey } from '../types/cleaner.types';
import { getAllItemsToDelete } from '../utils/selection-utils';
import { deleteFileSafely } from './delete-file-saftly';

type StartCleanupProps = {
  viewModel: CleanerViewModel;
  storedCleanerReport: CleanerReport;
  emitProgress: (progress: CleanupProgress) => void;
  cleanerSectionKeys: CleanerSectionKey[];
};

export const startCleanup = async ({ viewModel, storedCleanerReport, emitProgress, cleanerSectionKeys }: StartCleanupProps) => {
  if (cleanerStore.state.isCleanupInProgress) {
    logger.warn({ tag: 'CLEANER', msg: 'Cleanup already in progress, ignoring new request' });
    return;
  }

  if (!storedCleanerReport) {
    logger.error({ tag: 'CLEANER', msg: 'No cleaner report available. Generate a report first.' });
    return;
  }

  const itemsToDelete = getAllItemsToDelete({ viewModel, report: storedCleanerReport, cleanerSectionKeys });
  cleanerStore.state.currentAbortController = new AbortController();
  cleanerStore.state.totalFilesToDelete = itemsToDelete.length;
  cleanerStore.state.isCleanupInProgress = true;

  logger.debug({
    tag: 'CLEANER',
    msg: 'Starting cleanup process',
    totalFiles: cleanerStore.state.totalFilesToDelete,
  });

  emitProgress({
    currentCleaningPath: '',
    progress: 0,
    deletedFiles: 0,
    spaceGained: 0,
    cleaning: true,
    cleaningCompleted: false,
  });

  for (const [i, item] of itemsToDelete.entries()) {
    if (cleanerStore.state.currentAbortController?.signal.aborted) {
      logger.debug({ tag: 'CLEANER', msg: 'Cleanup process was aborted' });
      break;
    }

    if (!item) return;
    // TODO: Change type in getAllItemsToDelete
    await deleteFileSafely({ absolutePath: item.fullPath as AbsolutePath });

    const progress = Math.round(((i + 1) / cleanerStore.state.totalFilesToDelete) * 100);
    emitProgress({
      currentCleaningPath: item.fileName,
      progress,
      deletedFiles: cleanerStore.state.deletedFilesCount,
      spaceGained: cleanerStore.state.totalSpaceGained,
      cleaning: true,
      cleaningCompleted: false,
    });
  }

  emitProgress({
    currentCleaningPath: '',
    progress: 100,
    deletedFiles: cleanerStore.state.deletedFilesCount,
    spaceGained: cleanerStore.state.totalSpaceGained,
    cleaning: false,
    cleaningCompleted: true,
  });

  logger.debug({
    tag: 'CLEANER',
    msg: 'Cleanup process finished',
    deletedFiles: cleanerStore.state.deletedFilesCount,
    totalFiles: cleanerStore.state.totalFilesToDelete,
  });

  cleanerStore.reset();
};
