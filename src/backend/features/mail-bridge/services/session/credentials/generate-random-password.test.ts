import { generateRandomPassword } from './generate-random-password';

describe('generateRandomPassword', () => {
  it('produces a URL-safe password representing 32 bytes without padding', () => {
    const password = generateRandomPassword();

    expect(password).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(Buffer.from(password, 'base64url')).toHaveLength(32);
  });

  it('generates fresh passwords instead of reusing a cached value', () => {
    const passwords = Array.from({ length: 32 }, () => generateRandomPassword());

    expect(new Set(passwords).size).toBe(passwords.length);
  });
});
