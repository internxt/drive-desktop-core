import { logger } from '@/backend/core/logger/logger';

import { cleanerStore } from '../stores/cleaner.store';
import { CleanerViewModel, CleanupProgress, CleanerSectionKey, ExtendedCleanerReport, CleanerSection } from '../types/cleaner.types';
import { getAllItemsToDelete } from '../utils/selection-utils';
import { deleteFileSafely } from './delete-file-saftly';

type StartCleanupProps<T extends Record<string, CleanerSection> = {}> = {
  viewModel: CleanerViewModel;
  storedCleanerReport: ExtendedCleanerReport<T> | null;
  emitProgress: (progress: CleanupProgress) => void;
  cleanerSectionKeys: CleanerSectionKey<ExtendedCleanerReport<T>>[];
};

export async function startCleanup<T extends Record<string, CleanerSection> = {}>({
  viewModel,
  storedCleanerReport,
  emitProgress,
  cleanerSectionKeys,
}: StartCleanupProps<T>) {
  if (cleanerStore.state.isCleanupInProgress) {
    logger.warn({ tag: 'CLEANER', msg: 'Cleanup already in progress, ignoring new request' });
    return;
  }

  if (!storedCleanerReport) {
    logger.error({ tag: 'CLEANER', msg: 'No cleaner report available. Generate a report first.' });
    return;
  }

  const itemsToDelete = getAllItemsToDelete({ viewModel, report: storedCleanerReport, cleanerSectionKeys });
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
    await deleteFileSafely({ absolutePath: item.fullPath });

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
}
