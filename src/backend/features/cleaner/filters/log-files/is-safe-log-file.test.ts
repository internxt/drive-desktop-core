import { CleanerContext } from '../../types/cleaner.types';
import { logFileFilter } from './is-safe-log-file';

describe('is-safe-log-file', () => {
  const ctx = {
    logFiles: {
      safeExtensions: ['.log', '.txt', '.out', '.err', '.trace', '.debug', '.info', '.warn', '.error', '.gz', '.bz2', '.xz', '.zip'],
    },
  } as unknown as CleanerContext;

  describe('isSafeLogFile', () => {
    it.each([
      'application.log',
      'debug.txt',
      'output.out',
      'error.err',
      'trace.trace',
      'debug.debug',
      'info.info',
      'warn.warn',
      'error.error',
    ])('should return true for safe log file extensions', (fileName) => {
      expect(logFileFilter({ ctx, fileName })).toBe(true);
    });

    it.each(['application.log.gz', 'system.log.bz2', 'debug.log.xz', 'backup.log.zip'])(
      'should return true for compressed log files',
      (fileName) => {
        expect(logFileFilter({ ctx, fileName })).toBe(true);
      },
    );

    it.each(['app.LOG', 'debug.TXT', 'error.GZ', 'trace.BZ2'])('should return true for case insensitive extensions', (fileName) => {
      expect(logFileFilter({ ctx, fileName })).toBe(true);
    });

    it.each(['config.db', 'process.pid', 'app.lock', 'session.sqlite', 'socket.sock', 'binary.exe', 'script.sh'])(
      'should return false for unsafe file extensions',
      (fileName) => {
        expect(logFileFilter({ ctx, fileName })).toBe(false);
      },
    );

    it.each(['logfile', 'debug', 'output'])('should return false for files without extensions', (fileName) => {
      expect(logFileFilter({ ctx, fileName })).toBe(false);
    });
  });
});
