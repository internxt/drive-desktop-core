import type { Socket } from 'node:net';

import { logger } from '../../../../core/logger/logger';
import type { MailBridgeResources, MailBridgeStatus } from '../../mail-bridge.types';
import { stopMailBridgeResources } from '../stop-mail-bridge';
import type { MailBridgeLifecycleActions } from './lifecycle.types';

type HandleUnexpectedExitProps = MailBridgeLifecycleActions & {
  socket: Socket;
  error: Error;
  generation: number;
  lifecycleGeneration: number;
  stopping: boolean;
  runtimeSocket: Socket | undefined;
  status: MailBridgeStatus;
  resources: MailBridgeResources;
};

/**
 * Clears failed runtime state, requests resource cleanup, and notifies subscribers.
 * Ignores obsolete lifecycles, intentional shutdowns, and unrelated running sockets.
 * During startup, the runtime socket may not have been assigned yet.
 */
export function handleUnexpectedExit({
  socket,
  error,
  generation,
  lifecycleGeneration,
  stopping,
  runtimeSocket,
  status,
  resources,
  clearRuntimeResources,
  setStatus,
  setSyncProgress,
}: HandleUnexpectedExitProps): void {
  if (generation !== lifecycleGeneration) return;
  if (stopping || (runtimeSocket !== socket && status.status !== 'starting')) return;
  clearRuntimeResources();
  setSyncProgress(undefined);
  void stopMailBridgeResources(resources);
  logger.error({ msg: 'Mail Bridge stopped unexpectedly', error });
  setStatus({ status: 'error', error: error.message });
}
