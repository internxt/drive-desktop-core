import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

import { Result } from '../../../../../common/result';
import { createMailBridgeStateDirectory } from './create-mail-bridge-state-directory';

vi.mock('node:fs/promises', () => ({ mkdir: vi.fn() }));

describe('createMailBridgeStateDirectory', () => {
  beforeEach(() => {
    vi.mocked(mkdir).mockReset().mockResolvedValue(undefined);
  });

  it('creates private account directories beneath the supplied app data path', async () => {
    const first = await createMailBridgeStateDirectory({ baseDirectory: '/app-data', accountId: 'first-account' });
    const second = await createMailBridgeStateDirectory({ baseDirectory: '/app-data', accountId: 'second-account' });

    expect(first).toEqual(Result.ok(join('/app-data', 'mail-bridge', 'first-account')));
    expect(second).toEqual(Result.ok(join('/app-data', 'mail-bridge', 'second-account')));
    expect(first.data).not.toBe(second.data);
    expect(mkdir).toHaveBeenCalledWith(first.data, { recursive: true, mode: 0o700 });
    expect(mkdir).toHaveBeenCalledWith(second.data, { recursive: true, mode: 0o700 });
  });

  it('preserves filesystem errors', async () => {
    const error = new Error('Permission denied');
    vi.mocked(mkdir).mockRejectedValue(error);

    expect(await createMailBridgeStateDirectory({ baseDirectory: '/app-data', accountId: 'account' })).toEqual(Result.err(error));
  });

  it('returns an Error when directory creation rejects with an unknown value', async () => {
    vi.mocked(mkdir).mockRejectedValue('unknown failure');

    expect(await createMailBridgeStateDirectory({ baseDirectory: '/app-data', accountId: 'account' })).toEqual(
      Result.err(new Error('Could not create the Mail Bridge state directory')),
    );
  });
});
