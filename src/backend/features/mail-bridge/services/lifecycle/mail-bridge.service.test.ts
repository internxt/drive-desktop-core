/* eslint-disable sonarjs/no-hardcoded-passwords */
import { ChildProcess } from 'node:child_process';
import { Server, Socket } from 'node:net';

import { Result } from '../../../../../common/result';
import type { MailBridgeSession } from '../../constants';
import type { MailBridgeService, MailBridgePlatform } from '../../mail-bridge.types';
import { sendControlMessage } from '../communication/communication.service';
import { sendMailBridgeSessionUpdate } from '../communication/send-mail-bridge-session-update';
import { stopMailBridgeResources } from '../process/stop-mail-bridge';
import * as startRuntimeModule from '../startup/start-mail-bridge';
import { createMailBridgeService } from './mail-bridge.service';

vi.mock('../startup/start-mail-bridge', () => ({ startMailBridge: vi.fn() }));
vi.mock('../process/stop-mail-bridge', () => ({ stopMailBridgeResources: vi.fn() }));
vi.mock('../communication/send-mail-bridge-session-update', () => ({ sendMailBridgeSessionUpdate: vi.fn() }));
vi.mock('../communication/communication.service', () => ({ sendControlMessage: vi.fn() }));

describe('mail-bridge.service', () => {
  const startRuntimeMock = vi.mocked(startRuntimeModule.startMailBridge);
  const stopResourcesMock = vi.mocked(stopMailBridgeResources);
  const sendSessionUpdateMock = vi.mocked(sendMailBridgeSessionUpdate);
  let service: MailBridgeService;
  let platform: MailBridgePlatform;
  let socket: Socket;

  const session: MailBridgeSession = {
    account_id: 'account-id',
    addresses: ['user@internxt.com'],
    backend_session: { token: 'token', encryption_private_key: 'private-key', encryption_public_key: 'public-key' },
    mail_client: { username: 'user@internxt.com', password: 'password' },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    startRuntimeMock.mockReset();
    stopResourcesMock.mockResolvedValue({ data: undefined, error: undefined });
    sendSessionUpdateMock.mockResolvedValue({ data: undefined, error: undefined });
    vi.mocked(sendControlMessage).mockResolvedValue({ data: undefined, error: undefined });
    socket = new Socket();
    platform = {
      createControlEndpoint: vi.fn(),
      createMailBridgeStateDirectory: vi.fn(),
      spawnMailBridge: vi.fn(),
    };
    service = createMailBridgeService(platform);
    startRuntimeMock.mockResolvedValue({
      data: {
        child: new ChildProcess(),
        server: new Server(),
        socket,
        connection: {
          hostname: '127.0.0.1',
          imapPort: 1143,
          smtpPort: 2025,
          username: 'user@internxt.com',
          password: 'password',
          imapSecurity: 'STARTTLS',
          smtpSecurity: 'None',
        },
      },
      error: undefined,
    });
  });

  afterEach(() => socket.destroy());

  it('keeps runtime state and subscriptions isolated between service instances', async () => {
    const other = createMailBridgeService(platform);
    const otherListener = vi.fn();
    other.subscribeToMailBridgeStatus(otherListener);

    await service.startMailBridge(session);

    expect(service.getMailBridgeStatus().status).toBe('running');
    expect(other.getMailBridgeStatus()).toEqual({ status: 'stopped', error: undefined });
    expect(other.getMailBridgeSyncProgress()).toBeUndefined();
    expect(otherListener).not.toHaveBeenCalled();
    expect(startRuntimeMock).toHaveBeenCalledWith(expect.objectContaining({ session }), platform);
  });

  it('shares a pending startup and reuses the running connection', async () => {
    const first = service.startMailBridge(session);
    const second = service.startMailBridge(session);

    const [firstResult, secondResult] = await Promise.all([first, second]);
    expect(firstResult).toEqual(secondResult);
    expect(await service.startMailBridge(session)).toEqual(firstResult);
    expect(startRuntimeMock).toHaveBeenCalledTimes(1);
  });

  it('notifies subscribers and stops notifying them after unsubscribe', async () => {
    const statusListener = vi.fn();
    const progressListener = vi.fn();
    const unsubscribeStatus = service.subscribeToMailBridgeStatus(statusListener);
    const unsubscribeProgress = service.subscribeToMailBridgeSyncProgress(progressListener);
    await service.startMailBridge(session);
    const { onControlMessage } = startRuntimeMock.mock.calls[0]![0];
    onControlMessage({ socket, message: { type: 'sync_started', started: { total: 10 } } });
    onControlMessage({ socket, message: { type: 'sync_progress', progress: { percent: 40, downloaded: 4, total: 10 } } });

    expect(statusListener).toHaveBeenNthCalledWith(1, { status: 'starting', error: undefined });
    expect(statusListener).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'running' }));
    const progress = { percentage: 40, completedMessages: 4, totalMessages: 10 };
    expect(progressListener).toHaveBeenLastCalledWith(progress);
    expect(service.getMailBridgeSyncProgress()).toEqual(progress);

    unsubscribeStatus();
    unsubscribeProgress();
    statusListener.mockClear();
    progressListener.mockClear();
    await service.stopMailBridge();

    expect(statusListener).not.toHaveBeenCalled();
    expect(progressListener).not.toHaveBeenCalled();
    expect(service.getMailBridgeSyncProgress()).toBeUndefined();
    expect(service.getMailBridgeStatus().status).toBe('stopped');
  });

  it('ignores callbacks from a previous startup after stopping and restarting', async () => {
    await service.startMailBridge(session);
    const { onControlMessage, onUnexpectedExit } = startRuntimeMock.mock.calls[0]![0];
    await service.stopMailBridge();
    await service.startMailBridge(session);

    onControlMessage({ socket, message: { type: 'sync_started', started: { total: 10 } } });
    onUnexpectedExit({ socket, error: new Error('Old process exit') });

    expect(service.getMailBridgeStatus().status).toBe('running');
    expect(service.getMailBridgeSyncProgress()).toBeUndefined();
  });

  it('rejects resync while stopped and does not send token updates', async () => {
    expect(await service.resyncMailBridge()).toEqual(Result.err(new Error('Mail Bridge is not running')));
    expect(await service.updateMailBridgeAccessToken({ token: 'new-token' })).toEqual(Result.ok(undefined));
    expect(sendControlMessage).not.toHaveBeenCalled();
    expect(sendSessionUpdateMock).not.toHaveBeenCalled();
  });

  it('sends resync through the running socket and preserves errors', async () => {
    await service.startMailBridge(session);
    const error = new Error('Control channel failed');
    vi.mocked(sendControlMessage).mockResolvedValue({ data: undefined, error });

    expect((await service.resyncMailBridge()).error).toBe(error);
    expect(sendControlMessage).toHaveBeenCalledWith({ socket, message: { type: 'resync' } });
  });

  it('records startup errors without claiming the bridge is running', async () => {
    const error = new Error('Bridge could not connect');
    startRuntimeMock.mockResolvedValueOnce(Result.err(error));

    expect(await service.startMailBridge(session)).toEqual(Result.err(error));
    expect(service.getMailBridgeStatus()).toEqual({ status: 'error', error: error.message });
  });

  it('converts an unexpected startup rejection into an error result', async () => {
    startRuntimeMock.mockRejectedValueOnce('unknown failure');

    expect(await service.startMailBridge(session)).toEqual(Result.err(new Error('Mail Bridge could not start')));
    expect(service.getMailBridgeStatus().status).toBe('error');
  });

  it('cleans up and records an unexpected process exit', async () => {
    await service.startMailBridge(session);
    const error = new Error('Bridge process exited');
    startRuntimeMock.mock.calls[0]![0].onUnexpectedExit({ socket, error });

    expect(service.getMailBridgeStatus()).toEqual({ status: 'error', error: error.message });
    expect(stopResourcesMock).toHaveBeenCalledWith(expect.objectContaining({ socket }));
    expect(service.getMailBridgeSyncProgress()).toBeUndefined();
  });

  it('reports resource cleanup failures when stopping', async () => {
    await service.startMailBridge(session);
    const error = new Error('Could not close server');
    stopResourcesMock.mockResolvedValueOnce(Result.err(error));

    expect(await service.stopMailBridge()).toEqual(Result.err(error));
    expect(service.getMailBridgeStatus()).toEqual({ status: 'error', error: error.message });
  });

  it('waits for a cancelled startup before allowing a fresh startup', async () => {
    const cancelledStartup = Promise.withResolvers<Awaited<ReturnType<typeof startRuntimeModule.startMailBridge>>>();
    startRuntimeMock.mockImplementationOnce(async () => await cancelledStartup.promise);
    startRuntimeMock.mockResolvedValueOnce({ data: undefined, error: new Error('second startup') });

    const firstStartup = service.startMailBridge(session);
    const stopping = service.stopMailBridge();
    let hasStopped = false;
    void stopping.then(() => {
      hasStopped = true;
    });

    await new Promise((resolve) => setImmediate(resolve));
    expect(hasStopped).toBe(false);

    cancelledStartup.resolve({ data: undefined, error: new Error('startup cancelled') });
    await stopping;
    await firstStartup;
    await service.startMailBridge(session);

    expect(startRuntimeMock).toHaveBeenCalledTimes(2);
  });

  it('updates the access token when Mail Bridge is running', async () => {
    await service.startMailBridge(session);
    await service.updateMailBridgeAccessToken({ token: 'refreshed-token' });

    expect(sendSessionUpdateMock).toHaveBeenCalledWith({ socket, token: 'refreshed-token' });
    await service.stopMailBridge();
  });

  it('records only successful syncs as up to date', async () => {
    // Given
    await service.startMailBridge(session);
    const onControlMessage = startRuntimeMock.mock.calls[0]![0].onControlMessage;
    expect(service.getMailBridgeStatus()).not.toHaveProperty('lastChecked', expect.any(Number));
    // When
    onControlMessage({ socket, message: { type: 'sync_finished', finished: { downloaded: 1, total: 1 } } });
    // Then
    expect(service.getMailBridgeStatus()).toMatchObject({ lastChecked: expect.any(Number) });
    // When
    onControlMessage({
      socket,
      message: { type: 'sync_finished', finished: { downloaded: 0, total: 1, code: 'sync-failed' } },
    });
    // Then
    expect(service.getMailBridgeStatus()).not.toHaveProperty('lastChecked', expect.any(Number));
    await service.stopMailBridge();
  });
});
