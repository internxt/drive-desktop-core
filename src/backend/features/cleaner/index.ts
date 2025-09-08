import { processDirent } from './process-dirent';
import { scanDirectory } from './scan-directory';
import { scanSubDirectory } from './scan-subdirectory';

export const CleanerModule = {
  processDirent,
  scanDirectory,
  scanSubDirectory,
};

export type { CleanableItem, CleanerSection, CleanerReport } from './cleaner.types';
