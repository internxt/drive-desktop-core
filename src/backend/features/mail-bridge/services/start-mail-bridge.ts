import type { ChildProcess } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import type { Socket } from 'node:net';

import { Result } from '../../../../common/result';
import { logger } from '../../../core/logger/logger';
import type { ControlMessage } from '../constants';
import type { MailBridgeResources, MailBridgeRuntime, MailBridgePlatform, StartMailBridgeProps } from '../mail-bridge.types';
import { captureMailBridgeStartupStderr } from './capture-mail-bridge-startup-stderr';
import { createConnectionSettings, createControlServer, sendControlMessage } from './communication.service';
import { listenForMailBridgeControlMessages } from './mail-bridge-control-messages.service';
import { waitForMailBridgeConnection } from './startup/wait-for-mail-bridge-connection';
import { waitForMailBridgeReady } from './startup/wait-for-mail-bridge-ready';
import { stopMailBridgeResources } from './stop-mail-bridge';

/**
 * Starts the bridge through the host platform and completes the shared control handshake.
 * Publishes resources as they are created so the lifecycle service can stop a pending startup.
 * On failure or cancellation, closes the resources created so far.
 *
 * @param props - The secret session, cancellation signal, and lifecycle callbacks.
 * @param platform - Host functions for endpoints, account state storage, and process spawning.
 * @returns The ready runtime and mail-client settings, or the startup error.
 */
export async function startMailBridge(
  { session, onControlMessage, onUnexpectedExit, onResourcesChange, signal }: StartMailBridgeProps,
  platform: MailBridgePlatform,
): Promise<Result<MailBridgeRuntime, Error>> {
  const endpoint = await platform.createControlEndpoint(randomUUID());
  const { data: server, error: errorServer } = await createControlServer({ endpoint });
  if (errorServer) {
    await platform.removeControlEndpoint?.(endpoint);
    return Result.err(errorServer);
  }

  server.once('close', () => {
    // Linux creates the Unix socket inside a private temporary directory.
    // Once the server closes and removes its socket, release that directory through the platform callback.
    // Windows named pipes have no directory to remove, so the Windows adapter can omit this callback.
    if (platform.removeControlEndpoint) {
      void platform
        .removeControlEndpoint(endpoint)
        .catch((error) => logger.error({ msg: 'Could not remove Mail Bridge control endpoint', error }));
    }
  });

  logger.debug({ msg: 'Mail Bridge control server created' });
  onResourcesChange({ server });
  if (signal.aborted) {
    return await stopCancelledMailBridgeStart({ server });
  }

  const { data: stateDirectory, error: stateError } = await platform.createMailBridgeStateDirectory(session.account_id);
  if (stateError) {
    await stopMailBridgeResources({ server });
    return Result.err(stateError);
  }

  const { data: child, error: spawnMailBridgeError } = platform.spawnMailBridge({ endpoint, stateDirectory });
  if (spawnMailBridgeError) {
    await stopMailBridgeResources({ server });
    return Result.err(spawnMailBridgeError);
  }
  onResourcesChange({ child, server });
  logger.debug({ msg: 'Mail Bridge process started' });
  if (signal.aborted) return await stopCancelledMailBridgeStart({ child, server });
  const getStartupError = captureMailBridgeStartupStderr(child);

  const { data: socket, error: connectionError } = await waitForMailBridgeConnection({
    server,
    child,
    getStartupError,
  });
  if (connectionError) {
    await stopMailBridgeResources({ child, server });
    return Result.err(connectionError);
  }
  onResourcesChange({ child, server, socket });
  logger.debug({ msg: 'Mail Bridge control channel connected' });
  if (signal.aborted) {
    return await stopCancelledMailBridgeStart({ child, server, socket });
  }

  const sent = await sendControlMessage({ socket, message: { type: 'start_session', session } });
  if (sent.error) {
    await stopMailBridgeResources({ child, server, socket });
    return Result.err(sent.error);
  }

  logger.debug({ msg: 'Mail Bridge session initialization requested' });
  const ready = await waitForMailBridgeReady({
    socket,
    child,
    getStartupError,
  });
  if (ready.error) {
    await stopMailBridgeResources({ child, server, socket });
    return Result.err(ready.error);
  }

  logger.debug({ msg: 'Mail Bridge is ready' });
  const { data: connection, error: connectionSettingsError } = createConnectionSettings({
    ready: ready.data.ready,
    session,
  });
  if (connectionSettingsError) {
    await stopMailBridgeResources({ child, server, socket });
    return Result.err(connectionSettingsError);
  }

  listenForUnexpectedBridgeExit({
    child,
    socket,
    initialBuffer: ready.data.remaining,
    onControlMessage,
    onUnexpectedExit,
  });
  return Result.ok({ child, server, socket, connection });
}

function listenForUnexpectedBridgeExit({
  child,
  socket,
  initialBuffer,
  onControlMessage,
  onUnexpectedExit,
}: {
  child: ChildProcess;
  socket: Socket;
  initialBuffer: Buffer;
  onControlMessage: (input: { socket: Socket; message: ControlMessage }) => void;
  onUnexpectedExit: (input: { socket: Socket; error: Error }) => void;
}): void {
  child.once('exit', () => onUnexpectedExit({ socket, error: new Error('Mail Bridge stopped unexpectedly') }));
  child.once('error', (error) => onUnexpectedExit({ socket, error }));
  listenForMailBridgeControlMessages({ socket, initialBuffer, onControlMessage, onUnexpectedExit });
}

async function stopCancelledMailBridgeStart(resources: MailBridgeResources): Promise<Result<never, Error>> {
  const stopped = await stopMailBridgeResources(resources);
  return Result.err(stopped.error ?? new Error('Mail Bridge startup was cancelled'));
}
