import { ChildProcess } from 'node:child_process';
import { Server, Socket } from 'node:net';

import { Result } from '../../../../../common/result';
import { createStartupTimeout } from '../../utils/create-startup-timeout';
import { waitForControlConnection } from '../communication.service';
import { waitForMailBridgeConnection } from './wait-for-mail-bridge-connection';
import { waitForMailBridgeExit } from './wait-for-mail-bridge-exit';

vi.mock('../../utils/create-startup-timeout', () => ({ createStartupTimeout: vi.fn() }));
vi.mock('../communication.service', () => ({ waitForControlConnection: vi.fn() }));
vi.mock('./wait-for-mail-bridge-exit', () => ({ waitForMailBridgeExit: vi.fn() }));

describe('waitForMailBridgeConnection', () => {
  const child = new ChildProcess();
  const socket = new Socket();
  const server = new Server();
  const getStartupError = () => 'startup stderr';
  const cancel = vi.fn();
  const data = socket;

  beforeEach(() => {
    vi.mocked(waitForControlConnection).mockImplementation(() => new Promise(() => undefined));
    vi.mocked(waitForMailBridgeExit).mockImplementation(() => new Promise(() => undefined));
    vi.mocked(createStartupTimeout).mockReturnValue(Result.ok({ result: new Promise(() => undefined), cancel }));
  });

  function start() {
    return waitForMailBridgeConnection({ server, child, getStartupError });
  }

  function expectCleanedUp() {
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(vi.mocked(waitForMailBridgeExit).mock.calls[0][0].signal.aborted).toBe(true);
  }

  it('should return communication data and cancel the losing waits', async () => {
    vi.mocked(waitForControlConnection).mockResolvedValue(Result.ok(data));

    expect(await start()).toEqual(Result.ok(data));
    expect(waitForControlConnection).toHaveBeenCalledWith({ server });
    expect(waitForMailBridgeExit).toHaveBeenCalledWith({
      child,
      getStartupError,
      message: 'Mail Bridge exited before connecting',
      signal: expect.any(AbortSignal),
    });
    expectCleanedUp();
  });

  it('should preserve a communication error and clean up', async () => {
    const error = new Error('Communication failed');
    vi.mocked(waitForControlConnection).mockResolvedValue(Result.err(error));

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
    expect(waitForControlConnection).not.toHaveBeenCalled();
    expect(waitForMailBridgeExit).not.toHaveBeenCalled();
    expect(cancel).not.toHaveBeenCalled();
  });

  it('should preserve rejected communication errors and clean up', async () => {
    const error = new Error('Communication rejected');
    vi.mocked(waitForControlConnection).mockRejectedValue(error);

    expect((await start()).error).toBe(error);
    expectCleanedUp();
  });

  it('should wrap non-Error rejections and preserve their cause', async () => {
    vi.mocked(waitForControlConnection).mockRejectedValue('communication rejected');

    const result = await start();

    expect(result.error).toBeInstanceOf(Error);
    expect(result.error?.message).toBe('Mail Bridge failed during startup');
    expect(result.error?.cause).toBe('communication rejected');
    expectCleanedUp();
  });

  it('should clean up if communication throws before returning a promise', async () => {
    const error = new Error('Communication threw');
    vi.mocked(waitForControlConnection).mockImplementation(() => {
      throw error;
    });

    expect((await start()).error).toBe(error);
    expect(waitForMailBridgeExit).not.toHaveBeenCalled();
    expect(cancel).toHaveBeenCalledTimes(1);
  });
});
