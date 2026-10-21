/* eslint-disable sonarjs/no-hardcoded-passwords */
import { ChildProcess } from 'node:child_process';
import { Server, Socket } from 'node:net';

import { Result } from '../../../../common/result';
import type { MailBridgePlatform, StartMailBridgeProps } from '../mail-bridge.types';
import { createConnectionSettings, createControlServer, sendControlMessage } from './communication.service';
import { listenForMailBridgeControlMessages } from './mail-bridge-control-messages.service';
import { startMailBridge } from './start-mail-bridge';
import { waitForMailBridgeConnection } from './startup/wait-for-mail-bridge-connection';
import { waitForMailBridgeReady } from './startup/wait-for-mail-bridge-ready';
import { stopMailBridgeResources } from './stop-mail-bridge';

vi.mock('./communication.service', () => ({
  createControlServer: vi.fn(),
  sendControlMessage: vi.fn(),
  createConnectionSettings: vi.fn(),
}));
vi.mock('./capture-mail-bridge-startup-stderr', () => ({ captureMailBridgeStartupStderr: () => () => undefined }));
vi.mock('./startup/wait-for-mail-bridge-connection', () => ({ waitForMailBridgeConnection: vi.fn() }));
vi.mock('./startup/wait-for-mail-bridge-ready', () => ({ waitForMailBridgeReady: vi.fn() }));
vi.mock('./mail-bridge-control-messages.service', () => ({ listenForMailBridgeControlMessages: vi.fn() }));
vi.mock('./stop-mail-bridge', () => ({ stopMailBridgeResources: vi.fn() }));

describe('startMailBridge', () => {
  let server: Server;
  let child: ChildProcess;
  let socket: Socket;
  let platform: MailBridgePlatform;
  let props: StartMailBridgeProps;
  let cancellation: AbortController;
  const ready = { imap_address: '127.0.0.1:1143', smtp_address: '127.0.0.1:2025', starttls: true };
  const remaining = Buffer.from('buffered sync message');
  const connection = {
    hostname: '127.0.0.1',
    imapPort: 1143,
    smtpPort: 2025,
    username: 'user@inxt.me',
    password: 'test-password',
    imapSecurity: 'STARTTLS' as const,
    smtpSecurity: 'None' as const,
  };

  beforeEach(() => {
    server = new Server();
    child = new ChildProcess();
    socket = new Socket();
    cancellation = new AbortController();
    platform = {
      createControlEndpoint: vi.fn().mockResolvedValue('private-endpoint'),
      removeControlEndpoint: vi.fn().mockResolvedValue(undefined),
      createMailBridgeStateDirectory: vi.fn().mockResolvedValue(Result.ok('account-state')),
      spawnMailBridge: vi.fn().mockReturnValue(Result.ok(child)),
    };

    props = {
      session: {
        account_id: 'account-id',
        addresses: ['user@inxt.me'],
        backend_session: { token: 'test-token', encryption_private_key: 'private-key', encryption_public_key: 'public-key' },
        mail_client: { username: connection.username, password: connection.password },
      },
      signal: cancellation.signal,
      onResourcesChange: vi.fn(),
      onControlMessage: vi.fn(),
      onUnexpectedExit: vi.fn(),
    };
    vi.mocked(createControlServer).mockResolvedValue(Result.ok(server));
    vi.mocked(waitForMailBridgeConnection).mockResolvedValue(Result.ok(socket));
    vi.mocked(sendControlMessage).mockResolvedValue({ data: undefined, error: undefined });
    vi.mocked(waitForMailBridgeReady).mockResolvedValue(Result.ok({ ready, remaining }));
    vi.mocked(createConnectionSettings).mockReturnValue(Result.ok(connection));
    vi.mocked(stopMailBridgeResources).mockResolvedValue(Result.ok(undefined));
  });

  afterEach(() => socket.destroy());

  it('uses the platform adapter, sends the session, and returns the ready runtime', async () => {
    expect(await startMailBridge(props, platform)).toEqual(Result.ok({ child, server, socket, connection }));
    expect(platform.createControlEndpoint).toHaveBeenCalledWith(expect.any(String));
    expect(createControlServer).toHaveBeenCalledWith({ endpoint: 'private-endpoint' });
    expect(platform.createMailBridgeStateDirectory).toHaveBeenCalledWith('account-id');
    expect(platform.spawnMailBridge).toHaveBeenCalledWith({ endpoint: 'private-endpoint', stateDirectory: 'account-state' });
    expect(props.onResourcesChange).toHaveBeenNthCalledWith(1, { server });
    expect(props.onResourcesChange).toHaveBeenNthCalledWith(2, { child, server });
    expect(props.onResourcesChange).toHaveBeenNthCalledWith(3, { child, server, socket });
    expect(sendControlMessage).toHaveBeenCalledWith({ socket, message: { type: 'start_session', session: props.session } });
    expect(createConnectionSettings).toHaveBeenCalledWith({ ready, session: props.session });
    expect(listenForMailBridgeControlMessages).toHaveBeenCalledWith({
      socket,
      initialBuffer: remaining,
      onControlMessage: props.onControlMessage,
      onUnexpectedExit: props.onUnexpectedExit,
    });
    expect(stopMailBridgeResources).not.toHaveBeenCalled();
    server.emit('close');
    expect(platform.removeControlEndpoint).toHaveBeenCalledWith('private-endpoint');
  });

  it('supports synchronous endpoints without a cleanup callback', async () => {
    platform.createControlEndpoint = () => 'named-pipe';
    delete platform.removeControlEndpoint;
    expect(Result.isError(await startMailBridge(props, platform))).toBe(false);
    expect(() => server.emit('close')).not.toThrow();
  });

  it('removes the endpoint when the control server fails', async () => {
    const error = new Error('Endpoint unavailable');
    vi.mocked(createControlServer).mockResolvedValue(Result.err(error));
    expect(await startMailBridge(props, platform)).toEqual(Result.err(error));
    expect(platform.removeControlEndpoint).toHaveBeenCalledWith('private-endpoint');
    expect(platform.spawnMailBridge).not.toHaveBeenCalled();
  });

  it.each(['state', 'spawn', 'connection', 'session', 'ready', 'settings'] as const)('cleans up after a %s failure', async (phase) => {
    const error = new Error(`Failed during ${phase}`);
    if (phase === 'state') vi.mocked(platform.createMailBridgeStateDirectory).mockResolvedValue(Result.err(error));
    if (phase === 'spawn') vi.mocked(platform.spawnMailBridge).mockReturnValue(Result.err(error));
    if (phase === 'connection') vi.mocked(waitForMailBridgeConnection).mockResolvedValue(Result.err(error));
    if (phase === 'session') vi.mocked(sendControlMessage).mockResolvedValue({ data: undefined, error });
    if (phase === 'ready') vi.mocked(waitForMailBridgeReady).mockResolvedValue(Result.err(error));
    if (phase === 'settings') vi.mocked(createConnectionSettings).mockReturnValue(Result.err(error));
    expect(await startMailBridge(props, platform)).toEqual(Result.err(error));
    const resourcesByPhase = {
      state: { server },
      spawn: { server },
      connection: { child, server },
      session: { child, server, socket },
      ready: { child, server, socket },
      settings: { child, server, socket },
    };
    expect(stopMailBridgeResources).toHaveBeenCalledWith(resourcesByPhase[phase]);
    expect(listenForMailBridgeControlMessages).not.toHaveBeenCalled();
  });

  it.each(['server', 'process', 'socket'] as const)('cleans up when cancelled after creating the %s', async (phase) => {
    vi.mocked(props.onResourcesChange).mockImplementation((resources) => {
      if (
        (phase === 'server' && !resources.child) ||
        (phase === 'process' && resources.child && !resources.socket) ||
        (phase === 'socket' && resources.socket)
      )
        cancellation.abort();
    });
    expect((await startMailBridge(props, platform)).error?.message).toBe('Mail Bridge startup was cancelled');
    const resourcesByPhase = { server: { server }, process: { child, server }, socket: { child, server, socket } };
    expect(stopMailBridgeResources).toHaveBeenCalledWith(resourcesByPhase[phase]);
    expect(sendControlMessage).not.toHaveBeenCalled();
  });

  it('preserves a cleanup failure during cancellation', async () => {
    cancellation.abort();
    const error = new Error('Server could not close');
    vi.mocked(stopMailBridgeResources).mockResolvedValue(Result.err(error));
    expect(await startMailBridge(props, platform)).toEqual(Result.err(error));
  });

  it('reports unexpected process exits and errors after startup', async () => {
    await startMailBridge(props, platform);
    child.emit('exit', 1);
    expect(props.onUnexpectedExit).toHaveBeenCalledWith({ socket, error: new Error('Mail Bridge stopped unexpectedly') });
    const error = new Error('Process error');
    child.emit('error', error);
    expect(props.onUnexpectedExit).toHaveBeenCalledWith({ socket, error });
  });
});
