import { describe, it, expect, vi } from 'vitest';
import {
  isSafeWebBrowserFile,
  webBrowserFileFilter,
  getCriticalExtensionsForPlatform,
  getCriticalFilenamesForPlatform,
  isSafeWebBrowserFileAdvanced
} from './is-safe-web-browser-file';

describe('isSafeWebBrowserFile', () => {
  describe('Cross-platform critical patterns', () => {
    it('should reject files with lock patterns', () => {
      const lockFiles = ['lockfile', 'some-file.lock', '.#tempfile'];
      lockFiles.forEach(file => {
        expect(isSafeWebBrowserFile(file)).toBe(false);
      });
    });

    it('should reject temporary files', () => {
      const tempFiles = ['temp.tmp', 'cache.temp', 'download.part', 'file.crdownload'];
      tempFiles.forEach(file => {
        expect(isSafeWebBrowserFile(file)).toBe(false);
      });
    });

    it('should reject database files', () => {
      const dbFiles = ['cookies.sqlite', 'history.db', 'data.sqlite-wal', 'cache.sqlite-shm'];
      dbFiles.forEach(file => {
        expect(isSafeWebBrowserFile(file)).toBe(false);
      });
    });
  });

  describe('Platform-specific files', () => {
    const testCases = [
      {
        platform: 'linux',
        criticalExtensions: ['process.pid', 'socket.sock', 'service.socket'],
        criticalFilenames: ['prefs.js', 'cert9.db', 'key4.db'],
        safeFiles: ['cache-entry-123', 'temp-image.jpg', 'old-cache.dat']
      },
      {
        platform: 'win32',
        criticalExtensions: ['data.db-journal', 'cache.ldb', 'config.ini'],
        criticalFilenames: ['Local State', 'Preferences', 'Current Tabs'],
        safeFiles: ['cache-data.txt', 'temp-download.bin', 'media-cache-001']
      }
    ];

    testCases.forEach(({ platform, criticalExtensions, criticalFilenames, safeFiles }) => {
      describe(`${platform} specific files`, () => {
        const originalPlatform = process.platform;

        beforeEach(() => {
          vi.stubGlobal('process', { ...process, platform });
        });

        afterEach(() => {
          vi.stubGlobal('process', { ...process, platform: originalPlatform });
        });

        it('should reject critical extensions', () => {
          criticalExtensions.forEach(file => {
            expect(isSafeWebBrowserFile(file)).toBe(false);
          });
        });

        it('should reject critical filenames', () => {
          criticalFilenames.forEach(file => {
            expect(isSafeWebBrowserFile(file)).toBe(false);
          });
        });

        it('should allow safe files', () => {
          safeFiles.forEach(file => {
            expect(isSafeWebBrowserFile(file)).toBe(true);
          });
        });
      });
    });
  });

  describe('Browser-specific critical files', () => {
    const browserTestCases = [
      {
        browser: 'Chrome',
        criticalFiles: ['First Run', 'Bookmarks', 'Login Data']
      },
      {
        browser: 'Firefox',
        criticalFiles: ['profiles.ini', 'user.js', 'userChrome.css']
      }
    ];

    browserTestCases.forEach(({ browser, criticalFiles }) => {
      it(`should reject ${browser} critical files`, () => {
        criticalFiles.forEach(file => {
          expect(isSafeWebBrowserFile(file)).toBe(false);
        });
      });
    });
  });
});

describe('webBrowserFileFilter', () => {
  it('should return true for unsafe files (to skip them)', () => {
    const unsafeFiles = ['Preferences', 'cookies.sqlite'];
    unsafeFiles.forEach(file => {
      expect(webBrowserFileFilter(file)).toBe(true);
    });
  });

  it('should return false for safe files (to include them)', () => {
    const safeFiles = ['cache-item-123', 'temp-media.dat'];
    safeFiles.forEach(file => {
      expect(webBrowserFileFilter(file)).toBe(false);
    });
  });
});

describe('Platform utility functions', () => {
  describe('getCriticalExtensionsForPlatform', () => {
    it('should return correct extensions for each platform', () => {
      const platforms = {
        win32: ['.sqlite', '.db-journal', '.ldb'],
        linux: ['.pid', '.sock', '.socket'],
        unknown: ['.pid']
      };

      Object.entries(platforms).forEach(([platform, extensions]) => {
        expect(getCriticalExtensionsForPlatform(platform)).toEqual(expect.arrayContaining(extensions));
      });
    });
  });

  describe('getCriticalFilenamesForPlatform', () => {
    it('should return correct filenames for each platform', () => {
      const platforms = {
        win32: ['preferences', 'local state'],
        linux: ['prefs.js', 'cert9.db']
      };

      Object.entries(platforms).forEach(([platform, filenames]) => {
        expect(getCriticalFilenamesForPlatform(platform)).toEqual(expect.arrayContaining(filenames));
      });
    });
  });
});

describe('isSafeWebBrowserFileAdvanced', () => {
  it('should use browser-specific rules when context is provided', () => {
    const testCases = [
      { file: 'bookmarks', browser: 'chrome' as const, expected: false },
      { file: 'cache-item', browser: 'chrome' as const, expected: true },
      { file: 'places.sqlite', browser: 'firefox' as const, expected: false },
      { file: 'cache-entry', browser: 'firefox' as const, expected: true }
    ];

    testCases.forEach(({ file, browser, expected }) => {
      expect(isSafeWebBrowserFileAdvanced(file, browser)).toBe(expected);
    });
  });

  it('should fallback to general rules when no context is provided', () => {
    const testCases = [
      { file: 'preferences', expected: false },
      { file: 'cache-item', expected: true }
    ];

    testCases.forEach(({ file, expected }) => {
      expect(isSafeWebBrowserFileAdvanced(file)).toBe(expected);
    });
  });
});