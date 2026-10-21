import { Result } from '../../../../../common/result';
import { logger } from '../../../../core/logger/logger';
import type { MailBridgeLifecycleActions } from './lifecycle.types';

type FailStartupProps = MailBridgeLifecycleActions & {
  error: Error;
  generation: number;
  lifecycleGeneration: number;
};

/** Reports a startup failure without changing state when its lifecycle is obsolete. */
export function failStartup({
  error,
  generation,
  lifecycleGeneration,
  clearRuntimeResources,
  setStatus,
  setSyncProgress,
}: FailStartupProps): Result<never, Error> {
  if (generation !== lifecycleGeneration) return Result.err(error);
  clearRuntimeResources();
  setSyncProgress(undefined);
  logger.error({ msg: 'Mail Bridge failed to start', error });
  setStatus({ status: 'error', error: error.message });
  return Result.err(error);
}
