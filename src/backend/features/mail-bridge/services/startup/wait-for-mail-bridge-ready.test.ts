import { ChildProcess } from 'node:child_process';
import { Socket } from 'node:net';

import { Result } from '../../../../../common/result';
import { waitForReadyMessage } from '../communication/communication.service';
import { createStartupTimeout } from './create-startup-timeout';
import { waitForMailBridgeExit } from './wait-for-mail-bridge-exit';
import { waitForMailBridgeReady } from './wait-for-mail-bridge-ready';

vi.mock('./create-startup-timeout', () => ({ createStartupTimeout: vi.fn() }));
vi.mock('../communication/communication.service', () => ({ waitForReadyMessage: vi.fn() }));
vi.mock('./wait-for-mail-bridge-exit', () => ({ waitForMailBridgeExit: vi.fn() }));

describe('waitForMailBridgeReady', () => {
  const child = new ChildProcess();
  const socket = new Socket();
  const getStartupError = () => 'startup stderr';
  const cancel = vi.fn();
  const data = {
    ready: { imap_address: '127.0.0.1:1143', smtp_address: '127.0.0.1:1025', starttls: false },
    remaining: Buffer.from('next frame'),
  };

  beforeEach(() => {
    vi.mocked(waitForReadyMessage).mockImplementation(() => new Promise(() => undefined));
    vi.mocked(waitForMailBridgeExit).mockImplementation(() => new Promise(() => undefined));
    vi.mocked(createStartupTimeout).mockReturnValue(Result.ok({ result: new Promise(() => undefined), cancel }));
  });

  function start() {
    return waitForMailBridgeReady({ socket, child, getStartupError });
  }

  function expectCleanedUp() {
    expect(cancel).toHaveBeenCalledTimes(1);
    const exitCall = vi.mocked(waitForMailBridgeExit).mock.calls[0];
    expect(exitCall).toBeDefined();
    expect(exitCall?.[0].signal.aborted).toBe(true);
  }

  it('should return communication data and cancel the losing waits', async () => {
    vi.mocked(waitForReadyMessage).mockResolvedValue(Result.ok(data));

    expect(await start()).toEqual(Result.ok(data));
    expect(waitForReadyMessage).toHaveBeenCalledWith({ socket });
    expect(waitForMailBridgeExit).toHaveBeenCalledWith({
      child,
      getStartupError,
      message: 'Mail Bridge exited before becoming ready',
      signal: expect.any(AbortSignal),
    });
    expectCleanedUp();
  });

  it('should preserve a communication error and clean up', async () => {
    const error = new Error('Communication failed');
    vi.mocked(waitForReadyMessage).mockResolvedValue(Result.err(error));

    expect((await start()).error).toBe(error);
    expectCleanedUp();
  });

  it('should preserve a process-exit error and clean up', async () => {
    const error = new Error('Process exited');
    vi.mocked(waitForMailBridgeExit).mockResolvedValue(Result.err(error));

    expect((await start()).error).toBe(error);
    expectCleanedUp();
  });

  it('should preserve a timeout error and clean up', async () => {
    const error = new Error('Startup timed out');
    vi.mocked(createStartupTimeout).mockReturnValue(Result.ok({ result: Promise.resolve(Result.err(error)), cancel }));

    expect((await start()).error).toBe(error);
    expectCleanedUp();
  });

  it('should stop before registering waits when timeout creation fails', async () => {
    const error = new Error('Timer unavailable');
    vi.mocked(createStartupTimeout).mockReturnValue(Result.err(error));

    expect((await start()).error).toBe(error);
    expect(waitForReadyMessage).not.toHaveBeenCalled();
    expect(waitForMailBridgeExit).not.toHaveBeenCalled();
    expect(cancel).not.toHaveBeenCalled();
  });

  it('should preserve rejected communication errors and clean up', async () => {
    const error = new Error('Communication rejected');
    vi.mocked(waitForReadyMessage).mockRejectedValue(error);

    expect((await start()).error).toBe(error);
    expectCleanedUp();
  });

  it('should wrap non-Error rejections and preserve their cause', async () => {
    vi.mocked(waitForReadyMessage).mockRejectedValue('communication rejected');

    const result = await start();

    expect(result.error).toBeInstanceOf(Error);
    expect(result.error?.message).toBe('Mail Bridge failed during startup');
    expect(result.error?.cause).toBe('communication rejected');
    expectCleanedUp();
  });

  it('should clean up if communication throws before returning a promise', async () => {
    const error = new Error('Communication threw');
    vi.mocked(waitForReadyMessage).mockImplementation(() => {
      throw error;
    });

    expect((await start()).error).toBe(error);
    expect(waitForMailBridgeExit).not.toHaveBeenCalled();
    expect(cancel).toHaveBeenCalledTimes(1);
  });
});
