import { describe, it, expect } from 'vitest';
import { isSafeWebBrowserFile } from './is-safe-web-browser-file';

describe('isSafeWebBrowserFile', () => {
  describe('Cross-platform critical patterns', () => {
    it('should reject files with critical extensions', () => {
      const criticalFiles = ['file.sqlite', 'data.db', 'config.log'];
      criticalFiles.forEach((file) => {
        expect(isSafeWebBrowserFile(file)).toBe(false);
      });
    });

    it('should reject files with critical filenames', () => {
      const criticalFiles = ['lock', 'prefs.js', 'local state'];
      criticalFiles.forEach((file) => {
        expect(isSafeWebBrowserFile(file)).toBe(false);
      });
    });

    it('should allow safe files', () => {
      const safeFiles = ['document.txt', 'image.png', 'video.mp4'];
      safeFiles.forEach((file) => {
        expect(isSafeWebBrowserFile(file)).toBe(true);
      });
    });
  });

  describe('Browser-specific critical files', () => {
    it('should reject Chrome-specific critical files', () => {
      const chromeFiles = ['first run', 'local state', 'preferences'];
      chromeFiles.forEach((file) => {
        expect(isSafeWebBrowserFile(file)).toBe(false);
      });
    });

    it('should reject Firefox-specific critical files', () => {
      const firefoxFiles = ['profiles.ini', 'prefs.js', 'user.js'];
      firefoxFiles.forEach((file) => {
        expect(isSafeWebBrowserFile(file)).toBe(false);
      });
    });

    it('should reject Edge-specific critical files', () => {
      const edgeFiles = ['local state', 'preferences', 'first run'];
      edgeFiles.forEach((file) => {
        expect(isSafeWebBrowserFile(file)).toBe(false);
      });
    });
  });
});