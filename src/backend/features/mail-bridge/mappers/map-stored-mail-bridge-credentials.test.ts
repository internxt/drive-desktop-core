/* eslint-disable sonarjs/no-hardcoded-passwords */
import { Result } from '../../../../common/result';
import { mapStoredMailBridgeCredentials } from './map-stored-mail-bridge-credentials';

describe('mapStoredMailBridgeCredentials', () => {
  it('returns valid credentials unchanged', () => {
    const credentials = { username: 'user@inxt.me', password: 'local-client-secret' };
    const result = mapStoredMailBridgeCredentials(credentials);

    expect(Result.isError(result)).toBe(false);
    expect(result.data).toBe(credentials);
  });

  it('preserves additional stored fields', () => {
    const credentials = { username: 'user@inxt.me', password: 'local-client-secret', version: 1 };

    expect(mapStoredMailBridgeCredentials(credentials).data).toBe(credentials);
  });

  it('accepts empty strings because it validates structure rather than credential content', () => {
    const credentials = { username: '', password: '' };

    expect(mapStoredMailBridgeCredentials(credentials)).toEqual(Result.ok(credentials));
  });

  it.each([
    { label: 'undefined', value: undefined },
    { label: 'null', value: null },
    { label: 'a string', value: 'credentials' },
    { label: 'a number', value: 42 },
    { label: 'a boolean', value: false },
    { label: 'an array', value: [] },
    { label: 'an empty object', value: {} },
    { label: 'a missing username', value: { password: 'local-client-secret' } },
    { label: 'a missing password', value: { username: 'user@inxt.me' } },
    { label: 'a numeric username', value: { username: 42, password: 'local-client-secret' } },
    { label: 'a null username', value: { username: null, password: 'local-client-secret' } },
    { label: 'a numeric password', value: { username: 'user@inxt.me', password: 42 } },
    { label: 'a null password', value: { username: 'user@inxt.me', password: null } },
    { label: 'an object password', value: { username: 'user@inxt.me', password: {} } },
  ])('rejects $label with an actionable error', ({ value }) => {
    const result = mapStoredMailBridgeCredentials(value);

    expect(Result.isError(result)).toBe(true);
    expect(result.data).toBeUndefined();
    expect(result.error).toEqual(new Error('Stored Mail Bridge credentials are invalid'));
  });
});
