import type { Result } from '../../../../../common/result';
import type { MailBridgeConnectionSettings } from '../../constants';
import { attemptMailBridgeStartup } from './attempt-mail-bridge-startup';
import { completeMailBridgeStartup } from './complete-mail-bridge-startup';
import type { MailBridgeStartupContext, StartNewMailBridgeProps } from './lifecycle.types';

/**
 * Initializes one startup attempt, runs the handshake, and applies its result.
 * The helpers read current service state so obsolete attempts cannot replace a newer lifecycle.
 */
export async function startNewMailBridge(
  props: StartNewMailBridgeProps,
  context: MailBridgeStartupContext,
): Promise<Result<MailBridgeConnectionSettings, Error>> {
  context.setLastChecked(undefined);
  context.setStatus({ status: 'starting', error: undefined });

  const attempt = await attemptMailBridgeStartup(props, context);
  if ('failed' in attempt) return attempt.failed;
  return completeMailBridgeStartup(attempt.started, props, context);
}
