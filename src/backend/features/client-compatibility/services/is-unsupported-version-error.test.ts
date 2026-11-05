import { isUnsupportedVersionError } from './is-unsupported-version-error';

describe('is-unsupported-version-error', () => {
  it('should detect the unsupported version error code', () => {
    // When
    const res = isUnsupportedVersionError({
      body: { statusCode: 403, error: 'Forbidden', errorCode: 'CLIENT_VERSION_UNSUPPORTED', recommendedVersion: '2.8.1' },
    });
    // Then
    expect(res).toBe(true);
  });

  it.each([
    undefined,
    null,
    'CLIENT_VERSION_UNSUPPORTED',
    { statusCode: 403, error: 'Forbidden', message: 'This version of the app is no longer supported.' },
    { errorCode: 'OTHER_ERROR' },
  ])('should not detect it for %j', (body) => {
    // When
    const res = isUnsupportedVersionError({ body });
    // Then
    expect(res).toBe(false);
  });
});
