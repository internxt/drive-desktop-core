import { logFileFilter } from './is-safe-log-file';
import { CleanerContext } from '../../types/cleaner.types';

describe('is-safe-log-file', () => {
  const ctx = {
    logFiles: {
      safeExtensions: [
        '.log', '.txt', '.out', '.err', '.trace', '.debug',
        '.info', '.warn', '.error', '.gz', '.bz2', '.xz', '.zip'
      ],
    },
  } as unknown as CleanerContext;
  describe('isSafeLogFile', () => {
    it('should return true for safe log file extensions', () => {
      const safeLogFiles = [
        'application.log',
        'debug.txt',
        'output.out',
        'error.err',
        'trace.trace',
        'debug.debug',
        'info.info',
        'warn.warn',
        'error.error',
      ];

      safeLogFiles.forEach((fileName) => {
        expect(logFileFilter({ ctx, fileName })).toBe(true);
      });
    });

    it('should return true for compressed log files', () => {
      const compressedLogs = ['application.log.gz', 'system.log.bz2', 'debug.log.xz', 'backup.log.zip'];

      compressedLogs.forEach((fileName) => {
        expect(logFileFilter({ ctx, fileName })).toBe(true);
      });
    });

    it('should return true for case insensitive extensions', () => {
      const caseVariations = ['app.LOG', 'debug.TXT', 'error.GZ', 'trace.BZ2'];

      caseVariations.forEach((fileName) => {
        expect(logFileFilter({ ctx, fileName })).toBe(true);
      });
    });

    it('should return false for unsafe file extensions', () => {
      const unsafeFiles = ['config.db', 'process.pid', 'app.lock', 'session.sqlite', 'socket.sock', 'binary.exe', 'script.sh'];

      unsafeFiles.forEach((fileName) => {
        expect(logFileFilter({ ctx, fileName })).toBe(false);
      });
    });

    it('should return false for files without extensions', () => {
      const noExtensionFiles = ['logfile', 'debug', 'output'];

      noExtensionFiles.forEach((fileName) => {
        expect(logFileFilter({ ctx, fileName })).toBe(false);
      });
    });
  });
});
