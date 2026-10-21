import { Result } from '../../../../common/result';
import { logger } from '../../../core/logger/logger';
import type { MailBridgeConnectionSettings, MailBridgeSession, MailBridgeSyncProgress } from '../constants';
import type { MailBridgeService, MailBridgeStatus, MailBridgePlatform } from '../mail-bridge.types';
import { isMailBridgeStopped } from '../utils/is-mail-bridge-stopped';
import { sendControlMessage } from './communication.service';
import { createMailBridgeStartupContext } from './lifecycle/create-mail-bridge-startup-context';
import type { MailBridgeLifecycleState } from './lifecycle/lifecycle.types';
import { startNewMailBridge } from './lifecycle/start-new-mail-bridge';
import { sendMailBridgeSessionUpdate } from './send-mail-bridge-session-update';
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
  const state: MailBridgeLifecycleState = {
    runtime: undefined,
    resources: {},
    status: { status: 'stopped', error: undefined },
    lastChecked: undefined,
    stopping: false,
    lifecycleGeneration: 0,
  };
  let startup: ReturnType<typeof startNewMailBridge> | undefined;
  let startupCancellation: AbortController | undefined;
  let syncProgress: MailBridgeSyncProgress | undefined;
  const statusListeners = new Set<(nextStatus: MailBridgeStatus) => void>();
  const syncProgressListeners = new Set<(progress: MailBridgeSyncProgress | undefined) => void>();
  const startupContext = createMailBridgeStartupContext(platform, state, { setStatus, setSyncProgress });

  async function startMailBridge(session: MailBridgeSession): Promise<Result<MailBridgeConnectionSettings, Error>> {
    if (state.status.status === 'running' && state.runtime) {
      logger.debug({ tag: 'MAIL-BRIDGE', msg: 'Mail Bridge is already running' });
      return Result.ok(state.runtime.connection);
    }
    if (startup) {
      logger.debug({ msg: 'Mail Bridge startup already in progress' });
      return await startup;
    }

    logger.debug({ msg: 'Starting Mail Bridge' });
    const generation = ++state.lifecycleGeneration;
    startupCancellation = new AbortController();
    const nextStartup = startNewMailBridge({ session, signal: startupCancellation.signal, generation }, startupContext);
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
    state.stopping = true;
    state.lifecycleGeneration += 1;
    const cancelledStartup = startup;
    startupCancellation?.abort();
    const stopped = await stopMailBridgeResources(state.resources);
    startupContext.clearRuntimeResources();
    await cancelledStartup;
    if (startup === cancelledStartup) {
      startup = undefined;
      startupCancellation = undefined;
    }
    state.stopping = false;
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
    if (!state.runtime || isMailBridgeStopped({ status: state.status, runtime: state.runtime })) {
      logger.warn({ msg: 'Mail Bridge resync requested while stopped' });
      return Result.err(new Error('Mail Bridge is not running'));
    }
    logger.debug({ msg: 'Requesting Mail Bridge resync' });
    const result = await sendControlMessage({ socket: state.runtime.socket, message: { type: 'resync' } });
    if (result.error) logger.error({ msg: 'Mail Bridge resync request failed', error: result.error });
    return result;
  }

  async function updateMailBridgeAccessToken({ token }: { token: string }): Promise<Result<undefined, Error>> {
    if (!state.runtime || isMailBridgeStopped({ status: state.status, runtime: state.runtime })) {
      return Result.ok(undefined);
    }
    return await sendMailBridgeSessionUpdate({ socket: state.runtime.socket, token });
  }

  function getMailBridgeStatus(): MailBridgeStatus {
    return state.status;
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

  function setStatus(nextStatus: MailBridgeStatus): void {
    state.status = nextStatus;
    for (const listener of statusListeners) {
      listener(state.status);
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
