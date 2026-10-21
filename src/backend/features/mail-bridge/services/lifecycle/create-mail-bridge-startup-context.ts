import type { MailBridgePlatform } from '../../mail-bridge.types';
import type { MailBridgeLifecycleActions, MailBridgeLifecycleState, MailBridgeStartupContext } from './lifecycle.types';

/**
 * Builds startup operations over the state owned by one service instance.
 * Reads live state on demand and keeps runtime and cleanup resources in sync.
 * Status and progress updates use the service's existing notification functions.
 */
export function createMailBridgeStartupContext(
  platform: MailBridgePlatform,
  state: MailBridgeLifecycleState,
  notifications: Pick<MailBridgeLifecycleActions, 'setStatus' | 'setSyncProgress'>,
): MailBridgeStartupContext {
  return {
    platform,
    getState: () => {
      const { runtime, ...snapshot } = state;
      return { ...snapshot, runtimeSocket: runtime?.socket };
    },
    clearRuntimeResources: () => {
      state.runtime = undefined;
      state.resources = {};
    },
    setStatus: notifications.setStatus,
    setSyncProgress: notifications.setSyncProgress,
    setLastChecked: (checked) => {
      state.lastChecked = checked;
    },
    setResources: (resources) => {
      state.resources = resources;
    },
    setRuntime: (runtime) => {
      state.runtime = runtime;
      state.resources = runtime;
    },
  };
}
