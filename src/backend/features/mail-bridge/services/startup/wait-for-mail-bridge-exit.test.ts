import { ChildProcess } from 'node:child_process';

import { Result } from '../../../../../common/result';
import { createBridgeExitError } from '../../utils/create-bridge-exit-error';
import { waitForMailBridgeExit } from './wait-for-mail-bridge-exit';

vi.mock('../../utils/create-bridge-exit-error', () => ({ createBridgeExitError: vi.fn() }));

describe('waitForMailBridgeExit', () => {
  let child: ChildProcess;
  let cancellation: AbortController;
  const exitError = new Error('Bridge exited: startup details');
  const getStartupError = () => 'startup details';
  const message = 'Bridge exited';

  beforeEach(() => {
    child = new ChildProcess();
    cancellation = new AbortController();
    vi.mocked(createBridgeExitError).mockReturnValue(exitError);
  });

  afterEach(() => {
    cancellation.abort();
    expect(child.listenerCount('exit')).toBe(0);
    expect(child.listenerCount('error')).toBe(0);
  });

  function wait() {
    return waitForMailBridgeExit({ child, getStartupError, message, signal: cancellation.signal });
  }

  it('should report an already exited process without registering listeners', async () => {
    Object.defineProperty(child, 'exitCode', { value: 1 });

    const result = await wait();

    expect(result).toEqual(Result.err(exitError));
    expect(createBridgeExitError).toHaveBeenCalledWith({ message, getStartupError });
  });

  it('should remain pending until the process exits and then report startup details', async () => {
    const settled = vi.fn();
    const pending = wait();
    void pending.then(settled);
    await Promise.resolve();
    expect(settled).not.toHaveBeenCalled();
    expect(createBridgeExitError).not.toHaveBeenCalled();

    child.emit('exit', 1, null);

    expect(await pending).toEqual(Result.err(exitError));
    expect(createBridgeExitError).toHaveBeenCalledWith({ message, getStartupError });
  });

  it('should preserve the original process error', async () => {
    const pending = wait();
    const error = new Error('Executable failed');

    child.emit('error', error);

    expect(await pending).toEqual(Result.err(error));
    expect(createBridgeExitError).not.toHaveBeenCalled();
  });

  it('should return an abort error when cancelled while waiting', async () => {
    const pending = wait();

    cancellation.abort();

    const result = await pending;
    expect(result.error).toMatchObject({ name: 'AbortError' });
    expect(createBridgeExitError).not.toHaveBeenCalled();
  });

  it('should return an abort error when the signal is already cancelled', async () => {
    cancellation.abort();

    const result = await wait();

    expect(result.error).toMatchObject({ name: 'AbortError' });
    expect(createBridgeExitError).not.toHaveBeenCalled();
  });

  it('should wrap non-Error process failures and preserve their cause', async () => {
    const pending = wait();

    child.emit('error', 'process failure');

    const result = await pending;
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error?.message).toBe('Mail Bridge failed during startup');
    expect(result.error?.cause).toBe('process failure');
    expect(createBridgeExitError).not.toHaveBeenCalled();
  });
});
