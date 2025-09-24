import { CleanerContext } from '../../types/cleaner.types';
import { appCacheFileFilter } from './is-safe-cache-file';

describe('appCacheFileFilter', () => {
  const ctx = {
    appCache: {
      criticalExtensions: ['.lock', '.pid', '.db', '.sqlite', '.sqlite3', '.sock', '.socket'],
      criticalKeywords: ['session', 'state', 'preferences'],
    },
  } as unknown as CleanerContext;

  test.each(['.lock', '.pid', '.db', '.sqlite', '.sqlite3', '.sock', '.socket'])('should return false for %s files', (extension) => {
    const fileName = `test${extension}`;
    expect(appCacheFileFilter({ ctx, fileName })).toBe(false);
  });

  it('should handle uppercase extensions', () => {
    expect(appCacheFileFilter({ ctx, fileName: 'test.LOCK' })).toBe(false);
    expect(appCacheFileFilter({ ctx, fileName: 'test.DB' })).toBe(false);
    expect(appCacheFileFilter({ ctx, fileName: 'test.PID' })).toBe(false);
  });

  test.each(['session', 'state', 'preferences'])('should return false for files containing %s', (keyword) => {
    expect(appCacheFileFilter({ ctx, fileName: `${keyword}.dat` })).toBe(false);
    expect(appCacheFileFilter({ ctx, fileName: `user-${keyword}.json` })).toBe(false);
    expect(appCacheFileFilter({ ctx, fileName: `app-${keyword}-config` })).toBe(false);
  });

  it('should handle uppercase keywords', () => {
    expect(appCacheFileFilter({ ctx, fileName: 'SESSION.dat' })).toBe(false);
    expect(appCacheFileFilter({ ctx, fileName: 'user-STATE.json' })).toBe(false);
    expect(appCacheFileFilter({ ctx, fileName: 'PREFERENCES.xml' })).toBe(false);
  });

  it('should handle multiple dots', () => {
    expect(appCacheFileFilter({ ctx, fileName: 'app.session.backup.db' })).toBe(false);
    expect(appCacheFileFilter({ ctx, fileName: 'user-preferences-old.txt' })).toBe(false);
    expect(appCacheFileFilter({ ctx, fileName: 'data.v1.2.3.cache' })).toBe(true);
  });
});
