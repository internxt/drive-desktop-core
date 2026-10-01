import { synchronizeRemoteItems } from './services/synchronize-remote-items';

export const SyncModule = {
  MAX_FILE_SIZE: 40 * 1024 * 1024 * 1024,
  synchronizeRemoteItems,
};

export { synchronizeRemoteItems } from './services/synchronize-remote-items';
export type { SynchronizationPage, SynchronizationPageRequest } from './constants';
