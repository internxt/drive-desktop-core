import { isDirectoryWebBrowserRelated } from './is-directory-web-browser-related';

describe('isDirectoryWebBrowserRelated', () => {
  it.each(['google-chrome', 'chromium', 'firefox', 'opera'])('should return true for exact browser directory names: %s', (folderName) => {
    expect(isDirectoryWebBrowserRelated({ folderName })).toBe(true);
  });

  it.each(['Google-Chrome', 'CHROMIUM', 'Firefox', 'OPERA'])(
    'should return true for browser names with case variations: %s',
    (folderName) => {
      expect(isDirectoryWebBrowserRelated({ folderName })).toBe(true);
    },
  );

  it.each(['my-google-chrome-app', 'chromium-browser', 'firefox-dev', 'opera-stable'])(
    'should return true for directories containing browser names: %s',
    (folderName) => {
      expect(isDirectoryWebBrowserRelated({ folderName })).toBe(true);
    },
  );

  it.each(['vscode', 'telegram', 'discord', 'spotify'])('should return false for non-browser directory names: %s', (folderName) => {
    expect(isDirectoryWebBrowserRelated({ folderName })).toBe(false);
  });

  it('should return false for empty string', () => {
    expect(isDirectoryWebBrowserRelated({ folderName: '' })).toBe(false);
  });
});
