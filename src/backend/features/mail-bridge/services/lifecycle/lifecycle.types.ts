import type { Socket } from 'node:net';

import type { Result } from '../../../../../common/result';
import type { MailBridgeSession } from '../../constants';
import type {
  MailBridgePlatform,
  MailBridgeResources,
  MailBridgeRuntime,
  MailBridgeStatus,
  MailBridgeSyncProgress,
  StartMailBridgeProps,
} from '../../mail-bridge.types';

/** State updates owned by one service instance and used by its failure handlers. */
export type MailBridgeLifecycleActions = {
  clearRuntimeResources: () => void;
  setStatus: (status: MailBridgeStatus) => void;
  setSyncProgress: (progress: MailBridgeSyncProgress | undefined) => void;
};

/** Read the current service state when callbacks run or asynchronous startup settles. */
export type MailBridgeStartupState = {
  lifecycleGeneration: number;
  runtimeSocket: Socket | undefined;
  status: MailBridgeStatus;
  resources: MailBridgeResources;
  stopping: boolean;
  lastChecked: number | undefined;
};

/** Mutable lifecycle state owned by a single service instance. */
export type MailBridgeLifecycleState = Omit<MailBridgeStartupState, 'runtimeSocket'> & {
  runtime: MailBridgeRuntime | undefined;
};

/** Host operations and access to state owned by the service factory. */
export type MailBridgeStartupContext = MailBridgeLifecycleActions & {
  platform: MailBridgePlatform;
  getState: () => MailBridgeStartupState;
  setLastChecked: (lastChecked: number | undefined) => void;
  setResources: (resources: MailBridgeResources) => void;
  setRuntime: (runtime: MailBridgeRuntime) => void;
};

/** The session, cancellation signal, and generation captured for one startup attempt. */
export type StartNewMailBridgeProps = {
  session: MailBridgeSession;
  signal: AbortSignal;
  generation: number;
};

/** Separates a reported rejection from a runtime result still awaiting lifecycle checks. */
export type MailBridgeStartupAttempt = { started: Result<MailBridgeRuntime, Error> } | { failed: Result<never, Error> };

/** Runtime event handlers associated with a single startup generation. */
export type MailBridgeRuntimeCallbacks = Pick<StartMailBridgeProps, 'onResourcesChange' | 'onControlMessage' | 'onUnexpectedExit'>;
