import { ChildProcess, spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

import { Result } from '../../../../common/result';
import type { SpawnMailBridgeProps } from '../mail-bridge.types';
import { createMailBridgeStateDirectory, spawnMailBridge } from './mail-bridge-process.service';

vi.mock('node:child_process', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:child_process')>();
  return { ...actual, spawn: vi.fn() };
});
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

describe('spawnMailBridge', () => {
  let child: ChildProcess;
  let props: SpawnMailBridgeProps;

  beforeEach(() => {
    child = new ChildProcess();
    vi.mocked(spawn).mockReset().mockReturnValue(child);
    props = {
      executablePath: '/runtime with spaces/mail-bridge',
      workingDirectory: '/runtime with spaces',
      endpoint: 'private-endpoint',
      stateDirectory: '/account state',
      environment: { MAIL_API_URL: 'https://mail.example.test' },
    };
  });

  it('passes resolved paths and environment directly, without a shell or inherited standard streams', () => {
    expect(spawnMailBridge(props)).toEqual(Result.ok(child));
    expect(spawn).toHaveBeenCalledExactlyOnceWith(
      props.executablePath,
      ['--control-endpoint', props.endpoint, '--state-dir', props.stateDirectory],
      { cwd: props.workingDirectory, env: props.environment, windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] },
    );
  });

  it('allows the host to omit a working directory for packaged executables', () => {
    delete props.workingDirectory;

    expect(spawnMailBridge(props)).toEqual(Result.ok(child));
    expect(vi.mocked(spawn).mock.calls[0]?.[2]?.cwd).toBeUndefined();
  });

  it('preserves errors thrown while launching the process', () => {
    const error = new Error('Could not execute binary');
    vi.mocked(spawn).mockImplementation(() => {
      throw error;
    });

    expect(spawnMailBridge(props)).toEqual(Result.err(error));
  });

  it('returns an Error when launching throws an unknown value', () => {
    vi.mocked(spawn).mockImplementation(() => {
      // eslint-disable-next-line no-throw-literal, @typescript-eslint/only-throw-error -- Verify handling of non-Error exceptions.
      throw 'unknown failure';
    });

    expect(spawnMailBridge(props)).toEqual(Result.err(new Error('Could not start Mail Bridge')));
  });
});
