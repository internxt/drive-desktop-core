import { isClientVersionUnsupported } from './is-client-version-unsupported';

describe('is-client-version-unsupported', () => {
  it('should be unsupported when the backend says so', () => {
    // When
    const res = isClientVersionUnsupported({ status: 'unsupported' });
    // Then
    expect(res).toBe(true);
  });

  it.each(['up_to_date', 'update_recommended', 'deprecated'] as const)('should not be unsupported when the status is %s', (status) => {
    // When
    const res = isClientVersionUnsupported({ status });
    // Then
    expect(res).toBe(false);
  });
});
