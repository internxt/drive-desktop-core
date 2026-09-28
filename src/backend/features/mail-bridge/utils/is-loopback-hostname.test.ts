import { isLoopbackHostname } from './is-loopback-hostname';

describe('is-loopback-hostname', () => {
  it.each(['127.0.0.1', '127.0.0.2', '::1'])('should recognise a loopback hostname: %s', (hostname) => {
    expect(isLoopbackHostname(hostname)).toBe(true);
  });

  // eslint-disable-next-line sonarjs/no-hardcoded-ip
  it.each(['localhost', '192.168.1.10', 'mail.internxt.com'])('should reject a non-loopback hostname: %s', (hostname) => {
    expect(isLoopbackHostname(hostname)).toBe(false);
  });
});
