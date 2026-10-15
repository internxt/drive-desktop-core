import { ChildProcess } from 'node:child_process';
import { Server, Socket } from 'node:net';

import { Result } from '../../../../common/result';
import { startupTimeoutMs } from '../constants';
import * as timeoutService from '../utils/create-startup-timeout';
import { waitForControlConnection, waitForReadyMessage } from './communication.service';
import { waitForMailBridgeConnection, waitForMailBridgeReady } from './mail-bridge-startup.service';

vi.mock('./communication.service', () => ({ waitForControlConnection: vi.fn(), waitForReadyMessage: vi.fn() }));

describe.each(['connection', 'ready'] as const)('Mail Bridge startup: %s', (phase) => {
  let child: ChildProcess;
  let socket: Socket;
  let server: Server;

  beforeEach(() => {
    vi.useFakeTimers();
    child = new ChildProcess();
    socket = new Socket();
    server = new Server();
    vi.mocked(waitForControlConnection).mockImplementation(() => new Promise(() => undefined));
    vi.mocked(waitForReadyMessage).mockImplementation(() => new Promise(() => undefined));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllTimers();
    vi.useRealTimers();
    socket.destroy();
  });

  function start() {
    const getStartupError = () => 'startup stderr';
    return phase === 'connection'
      ? waitForMailBridgeConnection({ server, child, getStartupError })
      : waitForMailBridgeReady({ socket, child, getStartupError });
  }

  function expectCleanedUp() {
    expect(vi.getTimerCount()).toBe(0);
    expect(child.listenerCount('exit')).toBe(0);
    expect(child.listenerCount('error')).toBe(0);
  }

  it('should return successful startup data and release the timer and process listeners', async () => {
    const ready = { imap_address: '127.0.0.1:1143', smtp_address: '127.0.0.1:1025', starttls: false };
    const readyData = { ready, remaining: Buffer.from('next control frame') };
    vi.mocked(waitForControlConnection).mockResolvedValue({ data: socket, error: undefined });
    vi.mocked(waitForReadyMessage).mockResolvedValue({ data: readyData, error: undefined });

    const result = await start();

    expect(result).toEqual(Result.ok(phase === 'connection' ? socket : readyData));
    if (phase === 'connection') expect(waitForControlConnection).toHaveBeenCalledWith({ server });
    else expect(waitForReadyMessage).toHaveBeenCalledWith({ socket });
    expectCleanedUp();
  });

  it('should propagate communication errors and release startup resources', async () => {
    const error = new Error('Control channel failed');
    vi.mocked(waitForControlConnection).mockResolvedValue({ data: undefined, error });
    vi.mocked(waitForReadyMessage).mockResolvedValue({ data: undefined, error });

    const result = await start();

    expect(Result.isError<unknown, Error>(result)).toBe(true);
    expect(result.error).toBe(error);
    expectCleanedUp();
  });

  it('should time out when startup stalls and remove the process listeners', async () => {
    const pending = start();
    await vi.advanceTimersByTimeAsync(startupTimeoutMs);

    const result = await pending;

    expect(result).toEqual(Result.err(new Error('Mail Bridge startup timed out')));
    expectCleanedUp();
  });

  it('should include startup stderr when the process exits before startup completes', async () => {
    const pending = start();
    child.emit('exit', 1, null);

    const result = await pending;

    const message = phase === 'connection' ? 'Mail Bridge exited before connecting' : 'Mail Bridge exited before becoming ready';
    expect(result).toEqual(Result.err(new Error(`${message}: startup stderr`)));
    expectCleanedUp();
  });

  it('should detect a process that has already exited', async () => {
    Object.defineProperty(child, 'exitCode', { value: 1 });

    const result = await start();

    expect(Result.isError<unknown, Error>(result)).toBe(true);
    expect(result.error?.message).toContain('startup stderr');
    expectCleanedUp();
  });

  it('should preserve process errors and cancel the startup timer', async () => {
    const pending = start();
    const error = new Error('Executable could not start');
    child.emit('error', error);

    const result = await pending;

    expect(result.error).toBe(error);
    expectCleanedUp();
  });

  it('should return timer creation errors before waiting for startup', async () => {
    const error = new Error('Timer unavailable');
    vi.spyOn(timeoutService, 'createStartupTimeout').mockReturnValue(Result.err(error));

    const result = await start();

    expect(result.error).toBe(error);
    expect(waitForControlConnection).not.toHaveBeenCalled();
    expect(waitForReadyMessage).not.toHaveBeenCalled();
    expectCleanedUp();
  });

  it('should convert rejected communication requests into error results', async () => {
    const error = new Error('Communication rejected');
    vi.mocked(waitForControlConnection).mockRejectedValue(error);
    vi.mocked(waitForReadyMessage).mockRejectedValue(error);

    const result = await start();

    expect(result.error).toBe(error);
    expectCleanedUp();
  });
});
