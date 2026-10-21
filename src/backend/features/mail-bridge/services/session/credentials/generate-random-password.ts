import { randomBytes } from 'node:crypto';

const passwordBytes = 32;

/**
 * Creates a local mail-client password from 32 cryptographically random bytes.
 * Base64url encoding keeps the password free of padding and URL-reserved characters.
 *
 * @returns A 43-character password to encrypt and store for reuse by the account.
 */
export function generateRandomPassword(): string {
  return randomBytes(passwordBytes).toString('base64url');
}
