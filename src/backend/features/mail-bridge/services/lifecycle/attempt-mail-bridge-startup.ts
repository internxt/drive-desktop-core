import { startMailBridge as startRuntime } from '../start-mail-bridge';
import { createMailBridgeRuntimeCallbacks } from './create-mail-bridge-runtime-callbacks';
import { failStartup } from './fail-startup';
import type { MailBridgeStartupAttempt, MailBridgeStartupContext, StartNewMailBridgeProps } from './lifecycle.types';

/** Runs the platform startup handshake and reports thrown failures through the owning lifecycle. */
export async function attemptMailBridgeStartup(
  { session, signal, generation }: StartNewMailBridgeProps,
  context: MailBridgeStartupContext,
): Promise<MailBridgeStartupAttempt> {
  try {
    const callbacks = createMailBridgeRuntimeCallbacks(generation, context);
    const started = await startRuntime({ session, signal, ...callbacks }, context.platform);
    return { started };
  } catch (error) {
    return {
      failed: failStartup({
        ...context,
        lifecycleGeneration: context.getState().lifecycleGeneration,
        error: error instanceof Error ? error : new Error('Mail Bridge could not start'),
        generation,
      }),
    };
  }
}
