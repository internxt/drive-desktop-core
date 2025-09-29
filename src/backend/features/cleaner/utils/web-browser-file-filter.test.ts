import { mockProps } from '@/tests/vitest/utils.helper.test';

import { webBrowserFileFilter } from './web-browser-file-filter';

describe('webBrowserFileFilter', () => {
  let props: Parameters<typeof webBrowserFileFilter>[0];
  beforeEach(() => {
    props = mockProps<typeof webBrowserFileFilter>({
      fileName: '',
      ctx: {
        browser: {
          criticalExtensions: ['.sqlite', '.db', '.log'],
          criticalFilenames: ['lock', 'prefs.js', 'local state'],
          specificCriticalFile: {
            chrome: ['first run', 'local state', 'preferences'],
            firefox: ['profiles.ini', 'prefs.js', 'user.js'],
            edge: ['local state', 'preferences', 'first run'],
          },
        },
      },
    },
  };

  describe('Cross-platform critical patterns', () => {
    it.each(['file.sqlite', 'data.db', 'config.log'])('should reject files with critical extensions: "%s"', (file) => {
      props.fileName = file;
      expect(webBrowserFileFilter(props)).toBe(false);
    });

    it.each(['lock', 'prefs.js', 'local state'])('should reject files with critical filenames: "%s"', (file) => {
      props.fileName = file;
      expect(webBrowserFileFilter(props)).toBe(false);
    });

    it.each(['document.txt', 'image.png', 'video.mp4'])('should allow safe file: "%s"', (file) => {
      props.fileName = file;
      expect(webBrowserFileFilter(props)).toBe(true);
    });
  });

  describe('Browser-specific critical files', () => {
    it.each(['first run', 'local state', 'preferences'])('should reject Chrome-specific critical file: "%s"', (file) => {
      props.fileName = file;
      expect(webBrowserFileFilter(props)).toBe(false);
    });

    it.each(['profiles.ini', 'prefs.js', 'user.js'])('should reject Firefox-specific critical file: "%s"', (file) => {
      props.fileName = file;
      expect(webBrowserFileFilter(props)).toBe(false);
    });

    it.each(['local state', 'preferences', 'first run'])('should reject Edge-specific critical file: "%s"', (file) => {
      props.fileName = file;
      expect(webBrowserFileFilter(props)).toBe(false);
    });
  });
});
