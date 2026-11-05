import { CLIENT_VERSION_UNSUPPORTED_ERROR_CODE } from '../constants';

/**
 * v1.6.1 Alexis Mora
 * The 403 body is not part of the OpenAPI schema, so it is checked as unknown. The backend asks clients to rely
 * only on `errorCode`: the HTTP status (403 today, maybe 426 later), `error` and `message` can change.
 */
export function isUnsupportedVersionError({ body }: { body: unknown }) {
  return typeof body === 'object' && body !== null && 'errorCode' in body && body.errorCode === CLIENT_VERSION_UNSUPPORTED_ERROR_CODE;
}
