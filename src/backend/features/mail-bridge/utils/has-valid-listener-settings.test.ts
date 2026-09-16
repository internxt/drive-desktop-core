import { hasValidListenerSettings } from './has-valid-listener-settings';

describe('has-valid-listener-settings', () => {
  it('should accept matching loopback listener settings', () => {
    expect(
      hasValidListenerSettings({
        imapHostname: '127.0.0.1',
        smtpHostname: '127.0.0.1',
        imapPort: 1143,
        smtpPort: 2025,
      }),
    ).toBe(true);
  });

  it('should reject listener settings with different hostnames', () => {
    expect(
      hasValidListenerSettings({
        imapHostname: '127.0.0.1',
        smtpHostname: '127.0.0.2',
        imapPort: 1143,
        smtpPort: 2025,
      }),
    ).toBe(false);
  });
});
