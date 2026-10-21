import { Result } from '../../../../../common/result';
import { logger } from '../../../../core/logger/logger';
import type { MailBridgeConnectionSettings } from '../../constants';
import type { MailBridgeRuntime } from '../../mail-bridge.types';
import { failStartup } from './fail-startup';
import type { MailBridgeStartupContext, StartNewMailBridgeProps } from './lifecycle.types';

/** Checks cancellation and current state before publishing a startup result as a running runtime. */
export function completeMailBridgeStartup(
  started: Result<MailBridgeRuntime, Error>,
  { signal, generation }: StartNewMailBridgeProps,
  context: MailBridgeStartupContext,
): Result<MailBridgeConnectionSettings, Error> {
  const state = context.getState();
  if (signal.aborted || generation !== state.lifecycleGeneration) return Result.err(new Error('Mail Bridge startup was cancelled'));
  if (started.error) return failStartup({ ...context, lifecycleGeneration: state.lifecycleGeneration, error: started.error, generation });
  if (state.status.status !== 'starting') {
    return failStartup({
      ...context,
      lifecycleGeneration: state.lifecycleGeneration,
      error: new Error('Mail Bridge stopped before becoming ready'),
      generation,
    });
  }
  context.setRuntime(started.data);
  context.setStatus({ status: 'running', error: undefined, connection: started.data.connection, lastChecked: state.lastChecked });
  logger.debug({ msg: 'Mail Bridge started' });
  return Result.ok(started.data.connection);
}
