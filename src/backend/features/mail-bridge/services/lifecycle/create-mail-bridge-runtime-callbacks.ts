import { handleMailBridgeControlMessage } from './handle-control-message';
import { handleUnexpectedExit } from './handle-unexpected-exit';
import type { MailBridgeRuntimeCallbacks, MailBridgeStartupContext } from './lifecycle.types';

/**
 * Connects runtime events to one service instance and startup generation.
 * Each callback reads live state when invoked,
 * allowing lifecycle handlers to reject stale events and use resources assigned after the callbacks were created.
 */
export function createMailBridgeRuntimeCallbacks(generation: number, context: MailBridgeStartupContext): MailBridgeRuntimeCallbacks {
  const onResourcesChange: MailBridgeRuntimeCallbacks['onResourcesChange'] = (resources) => {
    if (generation !== context.getState().lifecycleGeneration) return;
    context.setResources(resources);
  };

  const onControlMessage: MailBridgeRuntimeCallbacks['onControlMessage'] = ({ socket, message }) => {
    const { lifecycleGeneration, runtimeSocket, status } = context.getState();
    handleMailBridgeControlMessage({
      socket,
      message,
      generation,
      lifecycleGeneration,
      runtimeSocket,
      status,
      setStatus: context.setStatus,
      setSyncProgress: context.setSyncProgress,
      setLastChecked: context.setLastChecked,
    });
  };

  const onUnexpectedExit: MailBridgeRuntimeCallbacks['onUnexpectedExit'] = ({ socket, error }) => {
    const { lifecycleGeneration, stopping, runtimeSocket, status, resources } = context.getState();
    handleUnexpectedExit({
      socket,
      error,
      generation,
      lifecycleGeneration,
      stopping,
      runtimeSocket,
      status,
      resources,
      clearRuntimeResources: context.clearRuntimeResources,
      setStatus: context.setStatus,
      setSyncProgress: context.setSyncProgress,
    });
  };

  return { onResourcesChange, onControlMessage, onUnexpectedExit };
}
