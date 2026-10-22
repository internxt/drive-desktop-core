import { ChildProcess } from 'node:child_process';
import { Server, Socket } from 'node:net';

import { Result } from '../../../../../common/result';
import type { MailBridgeSession } from '../../constants';
import type { MailBridgeRuntime } from '../../mail-bridge.types';
import { stopMailBridgeResources } from '../process/stop-mail-bridge';
import { startMailBridge as startRuntime } from '../startup/start-mail-bridge';
import type { MailBridgeStartupContext, MailBridgeStartupState } from './lifecycle.types';
import { startNewMailBridge } from './start-new-mail-bridge';

vi.mock('../startup/start-mail-bridge', () => ({ startMailBridge: vi.fn() }));
vi.mock('../process/stop-mail-bridge', () => ({ stopMailBridgeResources: vi.fn() }));

describe('startNewMailBridge', () => {
  let context: MailBridgeStartupContext;
  let state: MailBridgeStartupState;
  let runtime: MailBridgeRuntime;
  let cancellation: AbortController;
  const session: MailBridgeSession = {
    account_id: 'account-id',
    addresses: ['user@internxt.com'],
    backend_session: { token: '', encryption_private_key: '', encryption_public_key: '' },
    mail_client: { username: 'user@internxt.com', password: '' },
  };

  beforeEach(() => {
    cancellation = new AbortController();
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

    state = {
      lifecycleGeneration: 2,
      runtimeSocket: undefined,
      status: { status: 'stopped', error: undefined },
      resources: {},
      stopping: false,
      lastChecked: 100,
    };

    context = {
      platform: { createControlEndpoint: vi.fn(), createMailBridgeStateDirectory: vi.fn(), spawnMailBridge: vi.fn() },
      getState: () => state,
      clearRuntimeResources: vi.fn(() => {
        state.runtimeSocket = undefined;
        state.resources = {};
      }),
      setStatus: vi.fn((status) => {
        state.status = status;
      }),
      setLastChecked: vi.fn((lastChecked) => {
        state.lastChecked = lastChecked;
      }),
      setSyncProgress: vi.fn(),
      setResources: vi.fn((resources) => {
        state.resources = resources;
      }),
      setRuntime: vi.fn((nextRuntime) => {
        state.runtimeSocket = nextRuntime.socket;
        state.resources = nextRuntime;
      }),
    };
    vi.mocked(startRuntime).mockReset().mockResolvedValue(Result.ok(runtime));
    vi.mocked(stopMailBridgeResources).mockResolvedValue(Result.ok(undefined));
  });

  afterEach(() => {
    runtime.socket.destroy();
    vi.restoreAllMocks();
  });

  function start() {
    return startNewMailBridge({ session, signal: cancellation.signal, generation: 2 }, context);
  }

  it('resets the old check time, starts the platform runtime, and publishes its connection', async () => {
    const result = await start();

    expect(result.data).toBe(runtime.connection);
    expect(startRuntime).toHaveBeenCalledWith(expect.objectContaining({ session, signal: cancellation.signal }), context.platform);
    expect(context.setLastChecked).toHaveBeenCalledExactlyOnceWith(undefined);
    expect(context.setStatus).toHaveBeenNthCalledWith(1, { status: 'starting', error: undefined });
    expect(context.setRuntime).toHaveBeenCalledExactlyOnceWith(runtime);
    expect(state.status).toEqual({ status: 'running', error: undefined, connection: runtime.connection, lastChecked: undefined });
  });

  it('preserves a successful sync received during the startup handshake', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(200);
    vi.mocked(startRuntime).mockImplementationOnce(({ onResourcesChange, onControlMessage }) => {
      onResourcesChange(runtime);
      onControlMessage({ socket: runtime.socket, message: { type: 'sync_finished', finished: { downloaded: 4, total: 4 } } });
      return Promise.resolve(Result.ok(runtime));
    });

    await start();

    expect(context.setResources).toHaveBeenCalledExactlyOnceWith(runtime);
    expect(context.setSyncProgress).toHaveBeenCalledWith(undefined);
    expect(state.status).toMatchObject({ status: 'running', lastChecked: 200 });
  });

  it('reports runtime startup errors without publishing a running runtime', async () => {
    const error = new Error('Process could not start');
    vi.mocked(startRuntime).mockResolvedValueOnce(Result.err(error));

    const result = await start();

    expect(result.error).toBe(error);
    expect(context.clearRuntimeResources).toHaveBeenCalledExactlyOnceWith();
    expect(context.setRuntime).not.toHaveBeenCalled();
    expect(state.status).toEqual({ status: 'error', error: error.message });
  });

  it.each([new Error('Unexpected startup failure'), 'unknown failure'])('handles a rejected startup (%s)', async (error) => {
    vi.mocked(startRuntime).mockRejectedValueOnce(error);

    const result = await start();

    expect(result.error).toEqual(error instanceof Error ? error : new Error('Mail Bridge could not start'));
    expect(context.setRuntime).not.toHaveBeenCalled();
    expect(state.status.status).toBe('error');
  });

  it('does not publish a runtime when startup was cancelled', async () => {
    vi.mocked(startRuntime).mockImplementationOnce(() => {
      cancellation.abort();
      return Promise.resolve(Result.ok(runtime));
    });

    const result = await start();

    expect(result.error?.message).toBe('Mail Bridge startup was cancelled');
    expect(context.setRuntime).not.toHaveBeenCalled();
    expect(context.setStatus).toHaveBeenCalledTimes(1);
  });

  it('ignores obsolete resources, messages, exits, and successful startup completion', async () => {
    const pending = Promise.withResolvers<Awaited<ReturnType<typeof startRuntime>>>();
    vi.mocked(startRuntime).mockReturnValueOnce(pending.promise);
    const startup = start();
    const callbacks = vi.mocked(startRuntime).mock.calls[0]![0];
    state = { ...state, lifecycleGeneration: 3, status: { status: 'stopped', error: undefined } };

    callbacks.onResourcesChange(runtime);
    callbacks.onControlMessage({ socket: runtime.socket, message: { type: 'sync_started', started: { total: 4 } } });
    callbacks.onUnexpectedExit({ socket: runtime.socket, error: new Error('Old process exited') });
    pending.resolve(Result.ok(runtime));
    const result = await startup;

    expect(result.error?.message).toBe('Mail Bridge startup was cancelled');
    expect(context.setResources).not.toHaveBeenCalled();
    expect(context.setSyncProgress).not.toHaveBeenCalled();
    expect(context.clearRuntimeResources).not.toHaveBeenCalled();
    expect(stopMailBridgeResources).not.toHaveBeenCalled();
    expect(context.setRuntime).not.toHaveBeenCalled();
    expect(state.status.status).toBe('stopped');
  });

  it('does not overwrite a newer lifecycle when an older startup rejects', async () => {
    vi.mocked(startRuntime).mockImplementationOnce(() => {
      state = { ...state, lifecycleGeneration: 3, status: { status: 'stopped', error: undefined } };
      return Promise.reject(new Error('Old process failed'));
    });

    const result = await start();

    expect(result.error?.message).toBe('Old process failed');
    expect(context.clearRuntimeResources).not.toHaveBeenCalled();
    expect(context.setStatus).toHaveBeenCalledTimes(1);
    expect(state.status.status).toBe('stopped');
  });

  it('refuses to publish a ready runtime after an unexpected startup exit', async () => {
    const error = new Error('Process exited before startup finished');
    vi.mocked(startRuntime).mockImplementationOnce(({ onResourcesChange, onUnexpectedExit }) => {
      onResourcesChange(runtime);
      onUnexpectedExit({ socket: runtime.socket, error });
      return Promise.resolve(Result.ok(runtime));
    });

    const result = await start();

    expect(stopMailBridgeResources).toHaveBeenCalledExactlyOnceWith(runtime);
    expect(result.error?.message).toBe('Mail Bridge stopped before becoming ready');
    expect(context.setRuntime).not.toHaveBeenCalled();
    expect(state.status.status).toBe('error');
  });
});
