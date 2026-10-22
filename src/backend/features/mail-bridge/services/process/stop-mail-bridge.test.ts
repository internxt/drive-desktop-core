import { ChildProcess } from 'node:child_process';
import { Server, Socket } from 'node:net';

import { Result } from '../../../../../common/result';
import { closeControlServer } from '../communication/communication.service';
import { stopMailBridgeResources } from './stop-mail-bridge';

vi.mock('../communication/communication.service', () => ({ closeControlServer: vi.fn() }));

describe('stopMailBridgeResources', () => {
  beforeEach(() => {
    vi.mocked(closeControlServer).mockResolvedValue({ data: undefined, error: undefined });
  });

  afterEach(() => vi.restoreAllMocks());

  it('should succeed when no resources have been created', async () => {
    const result = await stopMailBridgeResources({});

    expect(result).toEqual(Result.ok(undefined));
    expect(closeControlServer).toHaveBeenCalledWith({ server: undefined });
  });

  it('should destroy the socket before closing the server and then terminate the process', async () => {
    const socket = new Socket();
    const server = new Server();
    const child = new ChildProcess();
    const kill = vi.spyOn(child, 'kill').mockReturnValue(true);
    vi.mocked(closeControlServer).mockImplementation(() => {
      expect(socket.destroyed).toBe(true);
      expect(kill).not.toHaveBeenCalled();
      return Promise.resolve({ data: undefined, error: undefined });
    });

    const result = await stopMailBridgeResources({ socket, server, child });

    expect(result).toEqual(Result.ok(undefined));
    expect(closeControlServer).toHaveBeenCalledWith({ server });
    expect(kill).toHaveBeenCalledTimes(1);
  });

  it('should terminate the process even when closing the server fails', async () => {
    const error = new Error('Could not close control server');
    const child = new ChildProcess();
    const kill = vi.spyOn(child, 'kill').mockReturnValue(true);
    vi.mocked(closeControlServer).mockResolvedValue({ data: undefined, error });

    const result = await stopMailBridgeResources({ child });

    expect(Result.isError(result)).toBe(true);
    expect(result.error).toBe(error);
    expect(kill).toHaveBeenCalledTimes(1);
  });

  it('should leave an already terminated process alone', async () => {
    const child = new ChildProcess();
    Object.defineProperty(child, 'killed', { value: true });
    const kill = vi.spyOn(child, 'kill').mockReturnValue(true);

    const result = await stopMailBridgeResources({ child });

    expect(result).toEqual(Result.ok(undefined));
    expect(kill).not.toHaveBeenCalled();
  });
});
