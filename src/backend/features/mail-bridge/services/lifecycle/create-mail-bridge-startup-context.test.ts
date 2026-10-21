import { ChildProcess } from 'node:child_process';
import { Server, Socket } from 'node:net';

import type { MailBridgePlatform, MailBridgeRuntime } from '../../mail-bridge.types';
import { createMailBridgeStartupContext } from './create-mail-bridge-startup-context';
import type { MailBridgeLifecycleState, MailBridgeStartupContext } from './lifecycle.types';

describe('createMailBridgeStartupContext', () => {
  let state: MailBridgeLifecycleState;
  let context: MailBridgeStartupContext;
  let platform: MailBridgePlatform;
  let runtime: MailBridgeRuntime;
  const notifications = { setStatus: vi.fn(), setSyncProgress: vi.fn() };

  beforeEach(() => {
    state = {
      runtime: undefined,
      resources: {},
      status: { status: 'stopped', error: undefined },
      lastChecked: undefined,
      stopping: false,
      lifecycleGeneration: 0,
    };
    platform = { createControlEndpoint: vi.fn(), createMailBridgeStateDirectory: vi.fn(), spawnMailBridge: vi.fn() };
    runtime = {
      socket: new Socket(),
      server: new Server(),
      child: new ChildProcess(),
      connection: {
        hostname: '127.0.0.1',
        imapPort: 1143,
        smtpPort: 1025,
        username: 'user@internxt.com',
        password: '',
        imapSecurity: 'None',
        smtpSecurity: 'None',
      },
    };
    context = createMailBridgeStartupContext(platform, state, notifications);
  });

  afterEach(() => runtime.socket.destroy());

  it('reads current state without changing an earlier snapshot', () => {
    const initial = context.getState();
    state.lifecycleGeneration = 2;
    state.stopping = true;
    context.setRuntime(runtime);
    context.setLastChecked(200);

    expect(context.getState()).toMatchObject({ lifecycleGeneration: 2, stopping: true, runtimeSocket: runtime.socket, lastChecked: 200 });
    expect(initial).toMatchObject({ lifecycleGeneration: 0, stopping: false, runtimeSocket: undefined, lastChecked: undefined });
  });

  it('tracks partial resources and replaces them with the ready runtime for cleanup', () => {
    const partialResources = { server: runtime.server };
    context.setResources(partialResources);

    expect(state.resources).toBe(partialResources);
    expect(state.runtime).toBeUndefined();

    context.setRuntime(runtime);

    expect(state.runtime).toBe(runtime);
    expect(state.resources).toBe(runtime);
    expect(context.getState().runtimeSocket).toBe(runtime.socket);
  });

  it('clears runtime resources without changing unrelated lifecycle state', () => {
    context.setRuntime(runtime);
    context.setLastChecked(200);
    state.lifecycleGeneration = 3;
    state.stopping = true;

    context.clearRuntimeResources();

    expect(state.runtime).toBeUndefined();
    expect(state.resources).toEqual({});
    expect(context.getState()).toMatchObject({ runtimeSocket: undefined, lastChecked: 200, lifecycleGeneration: 3, stopping: true });
  });

  it('uses the host platform and the service notification functions', () => {
    expect(context.platform).toBe(platform);
    context.setStatus({ status: 'starting', error: undefined });
    context.setSyncProgress({ percentage: 50, completedMessages: 2, totalMessages: 4 });

    expect(notifications.setStatus).toHaveBeenCalledExactlyOnceWith({ status: 'starting', error: undefined });
    expect(notifications.setSyncProgress).toHaveBeenCalledExactlyOnceWith({ percentage: 50, completedMessages: 2, totalMessages: 4 });
  });

  it('keeps contexts for separate service instances isolated', () => {
    const otherState: MailBridgeLifecycleState = { ...state, resources: {} };
    const otherContext = createMailBridgeStartupContext(platform, otherState, { setStatus: vi.fn(), setSyncProgress: vi.fn() });

    context.setRuntime(runtime);
    context.setLastChecked(200);
    state.lifecycleGeneration = 1;

    expect(otherContext.getState()).toMatchObject({
      runtimeSocket: undefined,
      resources: {},
      lastChecked: undefined,
      lifecycleGeneration: 0,
    });
    expect(otherState.runtime).toBeUndefined();
  });
});
