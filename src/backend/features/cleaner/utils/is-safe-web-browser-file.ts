/**
 * Critical file extensions that should never be deleted from web browser paths
 * Organized by platform for better maintainability
 */
const CRITICAL_EXTENSIONS = {
  linux: [
    '.lock',     // Process locks
    '.pid',      // Process IDs
    '.sock',     // Unix domain sockets
    '.socket',   // Socket files
    '.tmp',      // Temporary files that may be in use
    '.sqlite',   // SQLite databases (shared with other platforms)
    '.sqlite-wal', // SQLite Write-Ahead Logging
    '.sqlite-shm', // SQLite Shared Memory
    '.db',       // Database files
    '.json',     // Configuration files (often critical)
    '.log'       // Active log files
  ],
  
  // Windows specific extensions
  win32: [
    '.sqlite',     // SQLite databases
    '.sqlite-wal', // SQLite Write-Ahead Logging
    '.sqlite-shm', // SQLite Shared Memory
    '.db',         // Database files
    '.db-wal',     // Database Write-Ahead Logging
    '.db-shm',     // Database Shared Memory
    '.db-journal', // Database journal files
    '.log',        // Log files
    '.ldb',        // LevelDB files
    '.json',       // Configuration files
    '.pref',       // Preference files
    '.ini',        // Configuration files
    '.cfg'         // Configuration files
  ],
  
  // macOS specific extensions (for future compatibility)
  darwin: [
    '.sqlite',     // SQLite databases
    '.sqlite-wal', // SQLite Write-Ahead Logging
    '.sqlite-shm', // SQLite Shared Memory
    '.db',         // Database files
    '.plist',      // Property list files
    '.lock',       // Process locks
    '.json',       // Configuration files
    '.log'         // Log files
  ]
} as const;

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
    'formhistory.sqlite'
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
    'extension cookies'
  ],
  darwin: [
    'lock',
    'lockfile',
    'preferences',
    'local state',
    'cookies.binarycookies',
    'history.db',
    'bookmarks.plist',
    'downloads.plist',
    'topsites.plist'
  ]
} as const;

const CRITICAL_PATTERNS = [
  /^\.#/,
  /\.tmp$/i,
  /\.temp$/i,
  /\.bak$/i,
  /\.backup$/i,
  /^~\$/,
  /\.part$/i,
  /\.crdownload$/i,
  /\.download$/i,
  /lock/i,
  /journal/i,
  /wal$/i,
  /shm$/i
] as const;

/**
 * Check if a web browser file is safe to delete based on its extension, filename, and platform
 * @param fileName The name of the web storage file
 * @returns true if the file is safe to delete, false otherwise
 */
export function isSafeWebBrowserFile(fileName: string): boolean {
  const lowerName = fileName.toLowerCase();
  const platform = process.platform as keyof typeof CRITICAL_EXTENSIONS;

  // Check critical patterns first (cross-platform)
  if (CRITICAL_PATTERNS.some(pattern => pattern.test(fileName))) {
    return false;
  }

  // Get platform-specific critical extensions and filenames
  const criticalExtensions = CRITICAL_EXTENSIONS[platform] || CRITICAL_EXTENSIONS.linux;
  const criticalFilenames = CRITICAL_FILENAMES[platform] || CRITICAL_FILENAMES.linux;

  // Check if file has critical extension
  if (criticalExtensions.some((ext: string) => lowerName.endsWith(ext))) {
    return false;
  }

  // Check if filename is in critical filenames list
  if (criticalFilenames.some((filename: string) => filename === lowerName)) {
    return false;
  }

  // Additional safety checks for browser-specific files
  if (isBrowserSpecificCriticalFile(lowerName)) {
    return false;
  }

  return true;
}

/**
 * Check for browser-specific critical files that should never be deleted
 * @param lowerFileName File name in lowercase
 * @returns true if the file is critical for browser operation
 */
function isBrowserSpecificCriticalFile(lowerFileName: string): boolean {
  const chromeCriticalFiles = [
    'first run',
    'last version',
    'chrome_shutdown_ms.txt',
    'transporter_agent.log',
    'local state',
    'preferences',
    'secure preferences'
  ];

  const firefoxCriticalFiles = [
    'profiles.ini',
    'installs.ini',
    'times.json',
    'compatibility.ini',
    'prefs.js',
    'user.js',
    'userchrome.css',
    'usercontent.css'
  ];


  const edgeCriticalFiles = [
    'local state',
    'preferences',
    'secure preferences',
    'first run'
  ];

  const allCriticalFiles = [
    ...chromeCriticalFiles,
    ...firefoxCriticalFiles,
    ...edgeCriticalFiles
  ];

  return allCriticalFiles.includes(lowerFileName);
}

/**
 * Filter function for web files - returns true to skip file, false to include file
 * Used with scan functions' customFileFilter parameter
 */
export function webBrowserFileFilter(fileName: string): boolean {
  return !isSafeWebBrowserFile(fileName);
}

/**
 * Get the list of critical extensions for the current platform
 * Useful for debugging or configuration purposes
 * @param platform Optional platform override, defaults to current platform
 * @returns Array of critical file extensions
 */
export function getCriticalExtensionsForPlatform(platform?: string): readonly string[] {
  const targetPlatform = (platform || process.platform) as keyof typeof CRITICAL_EXTENSIONS;
  return CRITICAL_EXTENSIONS[targetPlatform] || CRITICAL_EXTENSIONS.linux;
}

/**
 * Get the list of critical filenames for the current platform
 * Useful for debugging or configuration purposes
 * @param platform Optional platform override, defaults to current platform
 * @returns Array of critical filenames
 */
export function getCriticalFilenamesForPlatform(platform?: string): readonly string[] {
  const targetPlatform = (platform || process.platform) as keyof typeof CRITICAL_FILENAMES;
  return CRITICAL_FILENAMES[targetPlatform] || CRITICAL_FILENAMES.linux;
}

/**
 * Advanced safety check that considers file context and browser type
 * @param fileName The file name to check
 * @param browserContext Optional context about which browser the file belongs to
 * @returns true if the file is safe to delete, false otherwise
 */
export function isSafeWebBrowserFileAdvanced(
  fileName: string, 
  browserContext?: 'chrome' | 'firefox' | 'edge' | 'brave'
): boolean {
  if (!isSafeWebBrowserFile(fileName)) {
    return false;
  }

  if (browserContext) {
    return isSafeForSpecificBrowser(fileName.toLowerCase(), browserContext);
  }

  return true;
}

/**
 * Browser-specific safety checks
 * @param lowerFileName File name in lowercase
 * @param browser The specific browser type
 * @returns true if safe to delete for that specific browser
 */
function isSafeForSpecificBrowser(lowerFileName: string, browser: string): boolean {
  switch (browser) {
    case 'chrome':
    case 'brave':
      const chromeCritical = [
        'bookmarks', 'history', 'login data', 'preferences', 
        'secure preferences', 'web data', 'cookies'
      ];
      return !chromeCritical.includes(lowerFileName);
      
    case 'firefox':
      // Firefox specific critical files
      const firefoxCritical = [
        'places.sqlite', 'cookies.sqlite', 'key4.db', 'cert9.db',
        'logins.json', 'prefs.js', 'user.js'
      ];
      return !firefoxCritical.includes(lowerFileName);   
    case 'edge':
      // Edge specific critical files (similar to Chrome)
      const edgeCritical = [
        'bookmarks', 'history', 'login data', 'preferences', 
        'secure preferences', 'web data'
      ];
      return !edgeCritical.includes(lowerFileName);
      
    default:
      return true;
  }
}
