import { CleanerContext } from '../../types/cleaner.types';
import { logFileFilter } from './log-file-filter';

describe('log-file-filter', () => {
  const ctx = {
    logFiles: {
      safeExtensions: ['.log', '.txt', '.out', '.gz'],
    },
  } as unknown as CleanerContext;

  it.each(['application.log', 'debug.txt', 'output.out'])('should return true for safe log file extensions', (fileName) => {
    expect(logFileFilter({ ctx, fileName })).toBe(true);
  });

  it.each(['application.log.gz', 'system.log.bz2', 'debug.log.xz'])('should return true for compressed log files', (fileName) => {
    expect(logFileFilter({ ctx, fileName })).toBe(true);
  });

  it.each(['app.LOG', 'debug.TXT', 'error.GZ'])('should return true for case insensitive extensions', (fileName) => {
    expect(logFileFilter({ ctx, fileName })).toBe(true);
  });

  it.each(['config.db', 'process.pid', 'app.lock'])('should return false for unsafe file extensions', (fileName) => {
    expect(logFileFilter({ ctx, fileName })).toBe(false);
  });

  it('should return false for files without extensions', () => {
    expect(logFileFilter({ ctx, fileName: 'logfile' })).toBe(false);
  });

  it.each(['app.log.1', 'debug.log.10.zip', 'error.log.zip'])(
    'should return true for rotated log files matching regex pattern: "%s"',
    (fileName) => {
      expect(logFileFilter({ ctx, fileName })).toBe(true);
    },
  );
});
