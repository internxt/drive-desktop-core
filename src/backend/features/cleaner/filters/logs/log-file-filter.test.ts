import { CleanerContext } from '../../types/cleaner.types';
import { logFileFilter } from './log-file-filter';

describe('log-file-filter', () => {
  const ctx = {
    logFiles: {
      safeExtensions: ['.log', '.txt', '.out', '.err', '.trace', '.debug', '.info', '.warn', '.error', '.gz', '.bz2', '.xz', '.zip'],
    },
  } as unknown as CleanerContext;

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

  it.each([
    'app.log.1',
    'app.log.2',
    'system.log.10',
    'debug.log.999',
    'app.log.1.gz',
    'app.log.2.bz2',
    'system.log.5.xz',
    'debug.log.10.zip',
    'application.log',
    'simple.log.gz',
    'backup.log.bz2',
    'trace.log.xz',
    'error.log.zip',
  ])('should return true for rotated log files matching regex pattern: "%s"', (fileName) => {
    expect(logFileFilter({ ctx, fileName })).toBe(true);
  });
});
