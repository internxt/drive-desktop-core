import type { Socket } from 'node:net';

import { Result } from '../../../../common/result';
import { logger } from '../../../core/logger/logger';
import type { ControlMessage, MailBridgeConnectionSettings, MailBridgeSession, MailBridgeSyncProgress } from '../constants';
import type { MailBridgeService, MailBridgeResources, MailBridgeRuntime, MailBridgeStatus, MailBridgePlatform } from '../mail-bridge.types';
import { isMailBridgeStopped } from '../utils/is-mail-bridge-stopped';
import { sendControlMessage } from './communication.service';
import { sendMailBridgeSessionUpdate } from './send-mail-bridge-session-update';
import { startMailBridge as startRuntime } from './start-mail-bridge';
import { stopMailBridgeResources } from './stop-mail-bridge';

/**
 * Creates an independent Mail Bridge lifecycle service for a desktop app.
 * Owns startup cancellation, runtime resources, status and sync subscriptions, resync requests, and access-token updates.
 * State is isolated per instance so platform operations are passed to the shared startup sequence.
 *
 * @param platform - Host operations for endpoint creation, storage, and process spawning.
 * @returns Lifecycle operations and subscriptions for this service instance.
 */
export function createMailBridgeService(platform: MailBridgePlatform): MailBridgeService {
  let runtime: MailBridgeRuntime | undefined;
  let resources: MailBridgeResources = {};
  let startup: ReturnType<typeof startNewMailBridge> | undefined;
  let startupCancellation: AbortController | undefined;
  let status: MailBridgeStatus = { status: 'stopped', error: undefined };
  let syncProgress: MailBridgeSyncProgress | undefined;
  let lastChecked: number | undefined;
  let stopping = false;
  let lifecycleGeneration = 0;
  const statusListeners = new Set<(nextStatus: MailBridgeStatus) => void>();
  const syncProgressListeners = new Set<(progress: MailBridgeSyncProgress | undefined) => void>();

  async function startMailBridge(session: MailBridgeSession): Promise<Result<MailBridgeConnectionSettings, Error>> {
    if (status.status === 'running' && runtime) {
      logger.debug({ msg: 'Mail Bridge is already running' });
      return Result.ok(runtime.connection);
    }
    if (startup) {
      logger.debug({ msg: 'Mail Bridge startup already in progress' });
      return await startup;
    }

    logger.debug({ msg: 'Starting Mail Bridge' });
    const generation = ++lifecycleGeneration;
    startupCancellation = new AbortController();
    const nextStartup = startNewMailBridge({ session, signal: startupCancellation.signal, generation });
    startup = nextStartup;
    try {
      return await nextStartup;
    } finally {
      if (startup === nextStartup) {
        startup = undefined;
        startupCancellation = undefined;
      }
    }
  }

  async function stopMailBridge(): Promise<Result<undefined, Error>> {
    logger.debug({ msg: 'Stopping Mail Bridge' });
    stopping = true;
    lifecycleGeneration += 1;
    const cancelledStartup = startup;
    startupCancellation?.abort();
    const stopped = await stopMailBridgeResources(resources);
    resources = {};
    runtime = undefined;
    await cancelledStartup;
    if (startup === cancelledStartup) {
      startup = undefined;
      startupCancellation = undefined;
    }
    stopping = false;
    if (stopped.error) {
      logger.error({ msg: 'Mail Bridge failed to stop', error: stopped.error });
      setStatus({ status: 'error', error: stopped.error.message });
      return stopped;
    }
    setSyncProgress(undefined);
    setStatus({ status: 'stopped', error: undefined });
    logger.debug({ msg: 'Mail Bridge stopped' });
    return stopped;
  }

  async function resyncMailBridge(): Promise<Result<undefined, Error>> {
    if (!runtime || isMailBridgeStopped({ status, runtime })) {
      logger.warn({ msg: 'Mail Bridge resync requested while stopped' });
      return Result.err(new Error('Mail Bridge is not running'));
    }
    logger.debug({ msg: 'Requesting Mail Bridge resync' });
    const result = await sendControlMessage({ socket: runtime.socket, message: { type: 'resync' } });
    if (result.error) logger.error({ msg: 'Mail Bridge resync request failed', error: result.error });
    return result;
  }

  async function updateMailBridgeAccessToken({ token }: { token: string }): Promise<Result<undefined, Error>> {
    if (!runtime || isMailBridgeStopped({ status, runtime })) {
      return Result.ok(undefined);
    }
    return await sendMailBridgeSessionUpdate({ socket: runtime.socket, token });
  }

  function getMailBridgeStatus(): MailBridgeStatus {
    return status;
  }

  function getMailBridgeSyncProgress(): MailBridgeSyncProgress | undefined {
    return syncProgress;
  }

  function subscribeToMailBridgeStatus(listener: (nextStatus: MailBridgeStatus) => void): () => void {
    statusListeners.add(listener);
    return () => statusListeners.delete(listener);
  }

  function subscribeToMailBridgeSyncProgress(listener: (progress: MailBridgeSyncProgress | undefined) => void): () => void {
    syncProgressListeners.add(listener);
    return () => syncProgressListeners.delete(listener);
  }

  async function startNewMailBridge({
    session,
    signal,
    generation,
  }: {
    session: MailBridgeSession;
    signal: AbortSignal;
    generation: number;
  }): Promise<Result<MailBridgeConnectionSettings, Error>> {
    lastChecked = undefined;
    setStatus({ status: 'starting', error: undefined });

    let started;
    try {
      started = await startRuntime(
        {
          session,
          signal,
          onResourcesChange: (nextResources) => updateResources({ nextResources, generation }),
          onControlMessage: (input) => handleControlMessage({ ...input, generation }),
          onUnexpectedExit: (input) => handleUnexpectedExit({ ...input, generation }),
        },
        platform,
      );
    } catch (error) {
      return failStartup({
        error: error instanceof Error ? error : new Error('Mail Bridge could not start'),
        generation,
      });
    }
    if (signal.aborted || generation !== lifecycleGeneration) return Result.err(new Error('Mail Bridge startup was cancelled'));
    if (started.error) return failStartup({ error: started.error, generation });
    if (getMailBridgeStatus().status !== 'starting') {
      return failStartup({ error: new Error('Mail Bridge stopped before becoming ready'), generation });
    }
    runtime = started.data;
    resources = started.data;
    setStatus({ status: 'running', error: undefined, connection: started.data.connection, lastChecked });
    logger.debug({ msg: 'Mail Bridge started' });
    return Result.ok(started.data.connection);
  }

  function handleControlMessage({ socket, message, generation }: { socket: Socket; message: ControlMessage; generation: number }): void {
    if (generation !== lifecycleGeneration) return;
    if (runtime?.socket !== socket && status.status !== 'starting') return;
    if (message.type === 'sync_started') {
      logger.debug({ msg: 'Mail Bridge sync started', totalMessages: message.started.total });
      return setSyncProgress({ percentage: 0, completedMessages: 0, totalMessages: message.started.total });
    }
    if (message.type === 'sync_progress') {
      return setSyncProgress({
        percentage: message.progress.percent,
        completedMessages: message.progress.downloaded,
        totalMessages: message.progress.total,
      });
    }
    if (message.type === 'sync_finished') {
      if (message.finished.code) logger.error({ msg: 'Mail Bridge sync failed', code: message.finished.code });
      else logger.debug({ msg: 'Mail Bridge sync finished' });
      lastChecked = message.finished.code ? undefined : Date.now();
      if (status.status === 'running') setStatus({ ...status, lastChecked });
      setSyncProgress(undefined);
    }
  }

  function handleUnexpectedExit({ socket, error, generation }: { socket: Socket; error: Error; generation: number }): void {
    if (generation !== lifecycleGeneration) return;
    if (stopping || (runtime?.socket !== socket && status.status !== 'starting')) return;
    const resourcesToStop = resources;
    runtime = undefined;
    resources = {};
    setSyncProgress(undefined);
    void stopMailBridgeResources(resourcesToStop);
    logger.error({ msg: 'Mail Bridge stopped unexpectedly', error });
    setStatus({ status: 'error', error: error.message });
  }

  function updateResources({ nextResources, generation }: { nextResources: MailBridgeResources; generation: number }): void {
    if (generation !== lifecycleGeneration) return;
    resources = nextResources;
  }

  function failStartup({ error, generation }: { error: Error; generation: number }): Result<never, Error> {
    if (generation !== lifecycleGeneration) return Result.err(error);
    runtime = undefined;
    resources = {};
    setSyncProgress(undefined);
    logger.error({ msg: 'Mail Bridge failed to start', error });
    setStatus({ status: 'error', error: error.message });
    return Result.err(error);
  }

  function setStatus(nextStatus: MailBridgeStatus): void {
    status = nextStatus;
    for (const listener of statusListeners) {
      listener(status);
    }
  }

  function setSyncProgress(progress: MailBridgeSyncProgress | undefined): void {
    syncProgress = progress;
    for (const listener of syncProgressListeners) {
      listener(progress);
    }
  }

  return {
    startMailBridge,
    stopMailBridge,
    resyncMailBridge,
    updateMailBridgeAccessToken,
    getMailBridgeStatus,
    getMailBridgeSyncProgress,
    subscribeToMailBridgeStatus,
    subscribeToMailBridgeSyncProgress,
  };
}
