/**
 * v0.1.1 Esteban Galvis
 * Critical file extensions that should never be deleted from web browser paths
 * to avoid corrupting user profiles or crashing the browser.
 */
const CRITICAL_EXTENSIONS = {
  linux: ['.lock', '.pid', '.sock', '.socket', '.tmp', '.sqlite', '.sqlite-wal', '.sqlite-shm', '.db', '.json', '.log'],
  win32: [
    '.sqlite',
    '.sqlite-wal',
    '.sqlite-shm',
    '.db',
    '.db-wal',
    '.db-shm',
    '.db-journal',
    '.log',
    '.ldb',
    '.json',
    '.pref',
    '.ini',
    '.cfg',
  ],
};

const CRITICAL_FILENAMES = {
  linux: [
    'lock',
    'lockfile',
    '.lock',
    'prefs.js',
    'user.js',
    'cert9.db',
    'key4.db',
    'logins.json',
    'places.sqlite',
    'favicons.sqlite',
    'cookies.sqlite',
    'permissions.sqlite',
    'content-prefs.sqlite',
    'formhistory.sqlite',
  ],
  win32: [
    'lock',
    'lockfile',
    'preferences',
    'local state',
    'current tabs',
    'last session',
    'secure preferences',
    'web data',
    'history',
    'login data',
    'cookies',
    'bookmarks',
    'favicons',
    'shortcuts',
    'top sites',
    'visited links',
    'network action predictor',
    'origin bound certs',
    'certificate revocation lists',
    'extension cookies',
  ],
};

export function isSafeWebBrowserFile(fileName: string) {
  const lowerName = fileName.toLowerCase();
  const platform = process.platform as keyof typeof CRITICAL_EXTENSIONS;

  const criticalExtensions = CRITICAL_EXTENSIONS[platform];
  const criticalFilenames = CRITICAL_FILENAMES[platform];

  return !(
    criticalExtensions.some((ext: string) => lowerName.endsWith(ext)) ||
    criticalFilenames.some((filename: string) => filename === lowerName) ||
    isBrowserSpecificCriticalFile(lowerName)
  );
}

function isBrowserSpecificCriticalFile(lowerFileName: string) {
  const chromeCriticalFiles = [
    'first run',
    'last version',
    'chrome_shutdown_ms.txt',
    'transporter_agent.log',
    'local state',
    'preferences',
    'secure preferences',
  ];

  const firefoxCriticalFiles = [
    'profiles.ini',
    'installs.ini',
    'times.json',
    'compatibility.ini',
    'prefs.js',
    'user.js',
    'userchrome.css',
    'usercontent.css',
  ];

  const edgeCriticalFiles = ['local state', 'preferences', 'secure preferences', 'first run'];

  const allCriticalFiles = [...chromeCriticalFiles, ...firefoxCriticalFiles, ...edgeCriticalFiles];

  return allCriticalFiles.includes(lowerFileName);
}
