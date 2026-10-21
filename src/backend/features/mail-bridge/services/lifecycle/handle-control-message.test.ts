import { Socket } from 'node:net';

import type { ControlMessage } from '../../constants';
import { handleMailBridgeControlMessage } from './handle-control-message';

describe('handleMailBridgeControlMessage', () => {
  let input: Parameters<typeof handleMailBridgeControlMessage>[0];
  let socket: Socket;
  let otherSocket: Socket;

  beforeEach(() => {
    socket = new Socket();
    otherSocket = new Socket();
    input = {
      socket,
      runtimeSocket: socket,
      generation: 2,
      lifecycleGeneration: 2,
      message: { type: 'sync_started', started: { total: 4 } },
      status: {
        status: 'running',
        error: undefined,
        lastChecked: 100,
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
      setStatus: vi.fn(),
      setSyncProgress: vi.fn(),
      setLastChecked: vi.fn(),
    };
    vi.spyOn(Date, 'now').mockReturnValue(200);
  });

  afterEach(() => {
    socket.destroy();
    otherSocket.destroy();
    vi.restoreAllMocks();
  });

  it('initializes progress when sync starts', () => {
    handleMailBridgeControlMessage(input);

    expect(input.setSyncProgress).toHaveBeenCalledExactlyOnceWith({ percentage: 0, completedMessages: 0, totalMessages: 4 });
    expect(input.setStatus).not.toHaveBeenCalled();
    expect(input.setLastChecked).not.toHaveBeenCalled();
  });

  it('updates progress from the bridge counters', () => {
    handleMailBridgeControlMessage({ ...input, message: { type: 'sync_progress', progress: { percent: 50, downloaded: 2, total: 4 } } });

    expect(input.setSyncProgress).toHaveBeenCalledExactlyOnceWith({ percentage: 50, completedMessages: 2, totalMessages: 4 });
    expect(input.setStatus).not.toHaveBeenCalled();
    expect(input.setLastChecked).not.toHaveBeenCalled();
  });

  it('clears progress and records a successful sync without losing connection settings', () => {
    handleMailBridgeControlMessage({ ...input, message: { type: 'sync_finished', finished: { downloaded: 4, total: 4 } } });

    expect(input.setLastChecked).toHaveBeenCalledExactlyOnceWith(200);
    expect(input.setStatus).toHaveBeenCalledExactlyOnceWith({ ...input.status, lastChecked: 200 });
    expect(input.setSyncProgress).toHaveBeenCalledExactlyOnceWith(undefined);
  });

  it('clears the previous successful check and progress when sync fails', () => {
    handleMailBridgeControlMessage({
      ...input,
      message: { type: 'sync_finished', finished: { downloaded: 2, total: 4, code: 'sync-failed' } },
    });

    expect(input.setLastChecked).toHaveBeenCalledExactlyOnceWith(undefined);
    expect(input.setStatus).toHaveBeenCalledExactlyOnceWith({ ...input.status, lastChecked: undefined });
    expect(input.setSyncProgress).toHaveBeenCalledExactlyOnceWith(undefined);
  });

  const syncMessages: ControlMessage[] = [
    { type: 'sync_started', started: { total: 4 } },
    { type: 'sync_progress', progress: { percent: 50, downloaded: 2, total: 4 } },
    { type: 'sync_finished', finished: { downloaded: 4, total: 4 } },
  ];

  it.each(syncMessages)('ignores $type from an old lifecycle', (message) => {
    handleMailBridgeControlMessage({ ...input, message, generation: 1 });

    expect(input.setSyncProgress).not.toHaveBeenCalled();
    expect(input.setStatus).not.toHaveBeenCalled();
    expect(input.setLastChecked).not.toHaveBeenCalled();
  });

  it.each(syncMessages)('ignores $type from an unrelated socket while running', (message) => {
    handleMailBridgeControlMessage({ ...input, message, socket: otherSocket });

    expect(input.setSyncProgress).not.toHaveBeenCalled();
    expect(input.setStatus).not.toHaveBeenCalled();
    expect(input.setLastChecked).not.toHaveBeenCalled();
  });

  it('accepts progress during startup before a runtime socket is assigned', () => {
    handleMailBridgeControlMessage({ ...input, runtimeSocket: undefined, status: { status: 'starting', error: undefined } });

    expect(input.setSyncProgress).toHaveBeenCalledExactlyOnceWith({ percentage: 0, completedMessages: 0, totalMessages: 4 });
    expect(input.setStatus).not.toHaveBeenCalled();
  });

  it('retains a successful startup sync time without prematurely changing status to running', () => {
    handleMailBridgeControlMessage({
      ...input,
      runtimeSocket: undefined,
      status: { status: 'starting', error: undefined },
      message: { type: 'sync_finished', finished: { downloaded: 4, total: 4 } },
    });

    expect(input.setLastChecked).toHaveBeenCalledExactlyOnceWith(200);
    expect(input.setSyncProgress).toHaveBeenCalledExactlyOnceWith(undefined);
    expect(input.setStatus).not.toHaveBeenCalled();
  });
});
