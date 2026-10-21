import { ChildProcess } from 'node:child_process';
import { Server, Socket } from 'node:net';

import { Result } from '../../../../../common/result';
import { stopMailBridgeResources } from '../stop-mail-bridge';
import { handleUnexpectedExit } from './handle-unexpected-exit';

vi.mock('../stop-mail-bridge', () => ({ stopMailBridgeResources: vi.fn() }));

describe('handleUnexpectedExit', () => {
  let input: Parameters<typeof handleUnexpectedExit>[0];
  let socket: Socket;
  let otherSocket: Socket;

  beforeEach(() => {
    socket = new Socket();
    otherSocket = new Socket();
    vi.mocked(stopMailBridgeResources).mockResolvedValue(Result.ok(undefined));
    input = {
      socket,
      runtimeSocket: socket,
      generation: 2,
      lifecycleGeneration: 2,
      stopping: false,
      error: new Error('Bridge process exited'),
      resources: { socket, server: new Server(), child: new ChildProcess() },
      status: {
        status: 'running',
        error: undefined,
        connection: {
          hostname: '127.0.0.1',
          imapPort: 1143,
          smtpPort: 1025,
          username: 'user@internxt.com',
          password: '',
          imapSecurity: 'None',
          smtpSecurity: 'None',
        },
      },
      clearRuntimeResources: vi.fn(),
      setSyncProgress: vi.fn(),
      setStatus: vi.fn(),
    };
  });

  afterEach(() => {
    socket.destroy();
    otherSocket.destroy();
  });

  it('clears failed state before notifying subscribers and cleans up the captured resources', () => {
    // Clearing the owning service must not discard the resources passed to cleanup.
    const resourcesToStop = input.resources;
    vi.mocked(input.clearRuntimeResources).mockImplementation(() => {
      input.resources = {};
    });

    handleUnexpectedExit(input);

    expect(input.clearRuntimeResources).toHaveBeenCalledExactlyOnceWith();
    expect(input.setSyncProgress).toHaveBeenCalledExactlyOnceWith(undefined);
    expect(stopMailBridgeResources).toHaveBeenCalledExactlyOnceWith(resourcesToStop);
    expect(input.setStatus).toHaveBeenCalledExactlyOnceWith({ status: 'error', error: input.error.message });
    expect(vi.mocked(input.clearRuntimeResources).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(input.setStatus).mock.invocationCallOrder[0]!,
    );
  });

  it.each([
    { scenario: 'an old lifecycle', generation: 1, stopping: false },
    { scenario: 'an intentional shutdown', generation: 2, stopping: true },
  ])('ignores exits from $scenario', ({ generation, stopping }) => {
    handleUnexpectedExit({ ...input, generation, stopping });

    expect(input.clearRuntimeResources).not.toHaveBeenCalled();
    expect(input.setSyncProgress).not.toHaveBeenCalled();
    expect(stopMailBridgeResources).not.toHaveBeenCalled();
    expect(input.setStatus).not.toHaveBeenCalled();
  });

  it('ignores an unrelated socket while running', () => {
    handleUnexpectedExit({ ...input, socket: otherSocket });

    expect(input.clearRuntimeResources).not.toHaveBeenCalled();
    expect(input.setSyncProgress).not.toHaveBeenCalled();
    expect(stopMailBridgeResources).not.toHaveBeenCalled();
    expect(input.setStatus).not.toHaveBeenCalled();
  });

  it('handles an exit during startup before a runtime socket is assigned', () => {
    handleUnexpectedExit({ ...input, runtimeSocket: undefined, status: { status: 'starting', error: undefined } });

    expect(input.clearRuntimeResources).toHaveBeenCalledExactlyOnceWith();
    expect(input.setSyncProgress).toHaveBeenCalledExactlyOnceWith(undefined);
    expect(stopMailBridgeResources).toHaveBeenCalledExactlyOnceWith(input.resources);
    expect(input.setStatus).toHaveBeenCalledExactlyOnceWith({ status: 'error', error: input.error.message });
  });
});
