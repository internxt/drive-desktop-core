import type { Socket } from 'node:net';

import { logger } from '../../../../core/logger/logger';
import type { ControlMessage, MailBridgeSyncProgress } from '../../constants';
import type { MailBridgeStatus } from '../../mail-bridge.types';

type HandleMailBridgeControlMessageProps = {
  socket: Socket;
  message: ControlMessage;
  generation: number;
  lifecycleGeneration: number;
  runtimeSocket: Socket | undefined;
  status: MailBridgeStatus;
  setStatus: (status: MailBridgeStatus) => void;
  setSyncProgress: (progress: MailBridgeSyncProgress | undefined) => void;
  setLastChecked: (lastChecked: number | undefined) => void;
};

/**
 * Applies sync messages to the owning service through explicit state callbacks.
 * Ignores messages from a previous lifecycle or a different running socket.
 * Messages received during startup are accepted before a runtime is assigned.
 * Only successful syncs record a last-checked time.
 */
export function handleMailBridgeControlMessage({
  socket,
  message,
  generation,
  lifecycleGeneration,
  runtimeSocket,
  status,
  setStatus,
  setSyncProgress,
  setLastChecked,
}: HandleMailBridgeControlMessageProps): void {
  if (generation !== lifecycleGeneration) return;
  if (runtimeSocket !== socket && status.status !== 'starting') return;
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
    const lastChecked = message.finished.code ? undefined : Date.now();
    setLastChecked(lastChecked);
    if (status.status === 'running') setStatus({ ...status, lastChecked });
    setSyncProgress(undefined);
  }
}
