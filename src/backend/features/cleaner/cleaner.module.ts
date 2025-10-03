import { processDirent } from './scan/process-dirent';
import { scanDirectory } from './scan/scan-directory';
import { scanSingleFile } from './scan/scan-single-file';
import { scanSubDirectory } from './scan/scan-subdirectory';
import { startCleanup } from './services/start-cleanup';
import { getDiskSpace } from './utils/get-disk-space';
import { isInternxtRelated } from './utils/is-file-internxt-related';
import { getAllItemsToDelete, getSelectedItemsForSection } from './utils/selection-utils';

export const CleanerModule = {
  getDiskSpace,
  isInternxtRelated,
  getAllItemsToDelete,
  getSelectedItemsForSection,
  processDirent,
  scanDirectory,
  scanSingleFile,
  scanSubDirectory,
  startCleanup,
};
