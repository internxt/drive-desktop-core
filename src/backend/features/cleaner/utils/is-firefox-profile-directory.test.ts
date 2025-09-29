import { stat } from 'node:fs/promises';

import { deepMocked } from '@/tests/vitest/utils.helper.test';

import { isFirefoxProfileDirectory } from './is-firefox-profile-directory';

vi.mock(import('node:fs/promises'));

describe('isFirefoxProfileDirectory', () => {
  const mockStat = deepMocked(stat);

  beforeEach(() => {
    mockStat.mockResolvedValue({ isDirectory: () => true });
  });

  it.each([
    ['abc123.default', '/home/user/firefox/profiles'],
    ['xyz789.default-esr', '/home/user/.mozilla/firefox/profiles'],
    ['profile.default-release', '/Users/john/Library/Application Support/Firefox/Profiles'],
    ['test123.default', '/path/to/firefox/profiles/subfolder'],
    ['a1b2c3.default-dev', '/PROFILES/firefox'],
    ['123.default', '/home/user/firefox/profiles'],
  ])('should return true for valid Firefox profile directory: "%s" in path "%s"', async (entry, parentPath) => {
    // When
    const result = await isFirefoxProfileDirectory({ entry, parentPath });
    // Then
    expect(result).toBe(true);
    expect(mockStat).toBeCalledWith(`${parentPath}/${entry}`);
  });

  it.each([
    ['not-a-profile', '/home/user/firefox/profiles'],
    ['profile', '/home/user/firefox/profiles'],
    ['profile.', '/home/user/firefox/profiles'],
    ['profile.default.extra', '/home/user/firefox/profiles'],
    ['profile-default', '/home/user/firefox/profiles'],
    ['.default', '/home/user/firefox/profiles'],
    ['profile.default-', '/home/user/firefox/profiles'],
  ])('should return false for invalid Firefox profile directory name: "%s"', async (entry, parentPath) => {
    // When
    const result = await isFirefoxProfileDirectory({ entry, parentPath });
    // Then
    expect(result).toBe(false);
  });

  it.each([
    ['abc123.default', '/home/user/firefox'],
    ['xyz789.default-esr', '/home/user/documents'],
    ['profile.default-release', '/Users/john/Library'],
    ['test123.default', '/random/path'],
  ])('should return false when parent path does not contain "profiles": "%s" in path "%s"', async (entry, parentPath) => {
    // When
    const result = await isFirefoxProfileDirectory({ entry, parentPath });
    // Then
    expect(result).toBe(false);
  });

  it('should return false when entry is not a directory', async () => {
    // Given
    mockStat.mockResolvedValue({ isDirectory: () => false });
    // When
    const result = await isFirefoxProfileDirectory({ entry: 'abc123.default', parentPath: '/home/user/firefox/profiles' });
    // Then
    expect(result).toBe(false);
  });

  it('should return false when stat fails', async () => {
    // Given
    mockStat.mockRejectedValue(new Error());
    // When
    const result = await isFirefoxProfileDirectory({ entry: 'abc123.default', parentPath: '/home/user/firefox/profiles' });
    // Then
    expect(result).toBe(false);
  });
});
