import { logPath } from './log-path';

vi.mock(import('node:os'), () => ({
  homedir: vi.fn(() => 'C:/Users/user'),
}));

describe('log-path', () => {
  it('should replace homedir', () => {
    // When
    const path = logPath({ path: 'C:/Users/user/file.txt' });
    // Then
    expect(path).toBe('~/file.txt');
  });

  it('should replace sync root folder', () => {
    // When
    const path = logPath({ path: 'D:/Users/user/InternxtDrive - uuid/file.txt' });
    // Then
    expect(path).toBe('D:/Users/user/~/file.txt');
  });

  it('should replace homedir and sync root folder', () => {
    // When
    const path = logPath({ path: 'C:/Users/user/InternxtDrive - uuid/file.txt' });
    // Then
    expect(path).toBe('~/~/file.txt');
  });
});
