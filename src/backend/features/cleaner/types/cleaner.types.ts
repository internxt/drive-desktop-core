import { AbsolutePath } from '@/backend/infra/file-system/file-system.types';

export type CleanableItem = {
  absolutePath: AbsolutePath;
  fileName: string;
  sizeInBytes: number;
};

export type CleanerSection = {
  totalSizeInBytes: number;
  items: CleanableItem[];
};
export type CleanerReport = {
  appCache: CleanerSection;
  logFiles: CleanerSection;
  trash: CleanerSection;
  webStorage: CleanerSection;
  webCache: CleanerSection;
};

export type ExtendedCleanerReport<T extends Record<string, CleanerSection> = {}> = CleanerReport & T;

export type CleanerSectionKey<T extends Record<string, CleanerSection> = CleanerReport> = keyof T;

export type CleanerSectionViewModel = {
  selectedAll: boolean;
  exceptions: string[];
};

export type CleanerViewModel<T extends Record<string, CleanerSection> = {}> = {
  [sectionKey in CleanerSectionKey<ExtendedCleanerReport<T>>]: CleanerSectionViewModel;
};

export type CleanupProgress = {
  currentCleaningPath: string;
  progress: number;
  deletedFiles: number;
  spaceGained: number;
  cleaning: boolean;
  cleaningCompleted: boolean;
};

type BrowserContext = {
  criticalExtensions: string[];
  criticalFilenames: string[];
};

type AppCacheContext = {
  criticalExtensions: string[];
  criticalKeywords: string[];
};

type LogFilesContext = {
  safeExtensions: string[];
};

export type CleanerContext = {
  browser: BrowserContext;
  appCache: AppCacheContext;
  logFiles: LogFilesContext;
};
export const CLEANER_SECTION_KEYS: readonly CleanerSectionKey<ExtendedCleanerReport>[] = [
  'appCache',
  'logFiles',
  'trash',
  'webStorage',
  'webCache',
] as const;
