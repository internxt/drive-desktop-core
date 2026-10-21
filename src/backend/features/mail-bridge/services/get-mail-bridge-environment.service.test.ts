import { Result } from '../../../../common/result';
import { getMailBridgeEnvironment } from './get-mail-bridge-environment.service';

describe('get-mail-bridge-environment.service', () => {
  let inheritedEnvironment: NodeJS.ProcessEnv;

  beforeEach(() => {
    inheritedEnvironment = structuredClone(process.env);
    inheritedEnvironment.PATH = 'system-path';
    inheritedEnvironment.MAIL_API_URL = undefined;
    inheritedEnvironment.MAIL_SERVER_PUBLIC_KEY = undefined;
  });

  it('should pass build configuration when the runtime environment has no Mail configuration', () => {
    // Given
    const mailApiUrl = 'https://mail.example.test';
    const mailServerPublicKey = 'server-public-key';
    const originalEnvironment = { ...inheritedEnvironment };
    // When
    const result = getMailBridgeEnvironment({ inheritedEnvironment, mailApiUrl, mailServerPublicKey });
    // Then
    expect(result).toEqual(Result.ok({ ...inheritedEnvironment, MAIL_API_URL: mailApiUrl, MAIL_SERVER_PUBLIC_KEY: mailServerPublicKey }));
    expect(inheritedEnvironment).toEqual(originalEnvironment);
  });

  it.each([undefined, '', '   '])('should reject a missing Mail API URL (%s) before starting the fixture mailbox', (mailApiUrl) => {
    // Given / When
    const result = getMailBridgeEnvironment({ inheritedEnvironment, mailApiUrl, mailServerPublicKey: undefined });
    // Then
    expect(result).toEqual(Result.err(new Error('Mail Bridge requires MAIL_API_URL')));
  });

  it('should allow an omitted server public key', () => {
    // Given / When
    const result = getMailBridgeEnvironment({
      inheritedEnvironment,
      mailApiUrl: 'https://mail.example.test',
      mailServerPublicKey: undefined,
    });
    // Then
    expect(result.error).toBeUndefined();
    expect(result.data?.MAIL_API_URL).toBe('https://mail.example.test');
  });
});
