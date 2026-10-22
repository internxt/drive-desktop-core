import { Socket } from 'node:net';

import { Result } from '../../../../../common/result';
import { stopMailBridgeResources } from '../process/stop-mail-bridge';
import { createMailBridgeRuntimeCallbacks } from './create-mail-bridge-runtime-callbacks';
import type { MailBridgeRuntimeCallbacks, MailBridgeStartupContext, MailBridgeStartupState } from './lifecycle.types';

vi.mock('../process/stop-mail-bridge', () => ({ stopMailBridgeResources: vi.fn() }));

describe('createMailBridgeRuntimeCallbacks', () => {
  let state: MailBridgeStartupState;
  let context: MailBridgeStartupContext;
  let callbacks: MailBridgeRuntimeCallbacks;
  let socket: Socket;

  beforeEach(() => {
    socket = new Socket();
    state = {
      lifecycleGeneration: 2,
      runtimeSocket: undefined,
      status: { status: 'starting', error: undefined },
      resources: {},
      stopping: false,
      lastChecked: undefined,
    };

    context = {
      platform: { createControlEndpoint: vi.fn(), createMailBridgeStateDirectory: vi.fn(), spawnMailBridge: vi.fn() },
      getState: vi.fn(() => state),
      clearRuntimeResources: vi.fn(),
      setStatus: vi.fn(),
      setSyncProgress: vi.fn(),
      setLastChecked: vi.fn(),
      setResources: vi.fn(),
      setRuntime: vi.fn(),
    };
    callbacks = createMailBridgeRuntimeCallbacks(2, context);
    vi.mocked(stopMailBridgeResources).mockResolvedValue(Result.ok(undefined));
  });

  afterEach(() => socket.destroy());

  it('updates resources only while the captured startup generation is current', () => {
    expect(context.getState).not.toHaveBeenCalled();
    const resources = { socket };
    callbacks.onResourcesChange(resources);
    state = { ...state, lifecycleGeneration: 3 };
    callbacks.onResourcesChange({});

    expect(context.setResources).toHaveBeenCalledExactlyOnceWith(resources);
  });

  it('ignores all events after the service moves to another lifecycle', () => {
    state = { ...state, lifecycleGeneration: 3 };

    callbacks.onResourcesChange({ socket });
    callbacks.onControlMessage({ socket, message: { type: 'sync_started', started: { total: 4 } } });
    callbacks.onUnexpectedExit({ socket, error: new Error('Old process exited') });

    expect(context.setResources).not.toHaveBeenCalled();
    expect(context.setSyncProgress).not.toHaveBeenCalled();
    expect(context.clearRuntimeResources).not.toHaveBeenCalled();
    expect(context.setStatus).not.toHaveBeenCalled();
    expect(stopMailBridgeResources).not.toHaveBeenCalled();
  });

  it('uses the current status to reject messages after startup has stopped', () => {
    callbacks.onControlMessage({ socket, message: { type: 'sync_started', started: { total: 4 } } });
    state = { ...state, status: { status: 'stopped', error: undefined } };
    callbacks.onControlMessage({ socket, message: { type: 'sync_progress', progress: { percent: 50, downloaded: 2, total: 4 } } });

    expect(context.setSyncProgress).toHaveBeenCalledExactlyOnceWith({ percentage: 0, completedMessages: 0, totalMessages: 4 });
  });

  it('uses the latest shutdown flag to ignore an intentional exit', () => {
    state = { ...state, stopping: true };

    callbacks.onUnexpectedExit({ socket, error: new Error('Process stopped') });

    expect(context.clearRuntimeResources).not.toHaveBeenCalled();
    expect(context.setSyncProgress).not.toHaveBeenCalled();
    expect(context.setStatus).not.toHaveBeenCalled();
    expect(stopMailBridgeResources).not.toHaveBeenCalled();
  });

  it('cleans up resources assigned after the callbacks were created', () => {
    const resources = { socket };
    state = { ...state, resources };
    const error = new Error('Process crashed');

    callbacks.onUnexpectedExit({ socket, error });

    expect(stopMailBridgeResources).toHaveBeenCalledExactlyOnceWith(resources);
    expect(context.clearRuntimeResources).toHaveBeenCalledExactlyOnceWith();
    expect(context.setSyncProgress).toHaveBeenCalledExactlyOnceWith(undefined);
    expect(context.setStatus).toHaveBeenCalledExactlyOnceWith({ status: 'error', error: error.message });
  });
});
