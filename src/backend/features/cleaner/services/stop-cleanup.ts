import { logger } from '@/backend/core/logger/logger';

import { cleanerStore } from '../stores/cleaner.store';

export const stopCleanup = (): void => {
  if (!cleanerStore.state.isCleanupInProgress || !cleanerStore.state.currentAbortController) {
    logger.warn({ tag: 'CLEANER', msg: 'No cleanup process to stop' });
    return;
  }

  logger.debug({ tag: 'CLEANER', msg: 'Stopping cleanup process' });
  cleanerStore.state.currentAbortController.abort();
  cleanerStore.reset();
};
