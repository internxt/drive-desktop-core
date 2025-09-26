export type CleanableItem = {
  fullPath: string;
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

export type CleanerSectionKey = keyof CleanerReport;

export type AppCachePaths = {
  userCache: string;
  tmpDir: string;
  varTmpDir: string;
  localShareCache: string;
};

export type LogFilesPaths = {
  localShareLogs: string;
  xsessionErrorsFile: string;
  varLogDir: string;
};

export type TrashFilesPaths = {
  localShareTrash: string;
  legacyTrash: string;
  xdgDataTrash?: string;
};

export type WebStorageFilesPaths = {
  chromeCookies: string;
  chromeLocalStorage: string;
  chromeSessionStorage: string;
  chromeIndexedDB: string;
  chromeWebStorage: string;
  firefoxProfile: string;
  braveCookies: string;
  braveLocalStorage: string;
  braveSessionStorage: string;
  braveIndexedDB: string;
  braveWebStorage: string;
};

export type WebCacheFilesPaths = {
  chromeCacheDir: string;
  firefoxCacheDir: string;
  braveCacheDir: string;
};

export type CleanerSectionViewModel = {
  selectedAll: boolean;
  exceptions: string[];
};

export type CleanerViewModel = {
  [sectionKey: string]: CleanerSectionViewModel;
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
  specificCriticalFile: {
    chrome: string[];
    firefox: string[];
    edge: string[];
  };
};

type AppCacheContext = {
  paths: AppCachePaths;
  criticalExtensions: string[];
  criticalKeywords: string[];
};

type LogFilesContext = {
  paths: LogFilesPaths;
  safeExtensions: string[];
};

export type CleanerContext = {
  browser: BrowserContext;
  appCache: AppCacheContext;
  logFiles: LogFilesContext;
};
