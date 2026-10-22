import { logger } from '@/backend/core/logger/logger';
import { Result } from '@/common/result';

import { FILE_SIZE_LIMIT_REVALIDATION_INTERVAL_MS } from '../constants';
import { FileSizeLimitAdapter } from '../file-size-limit.types';

type Props = Pick<FileSizeLimitAdapter, 'saveLimit' | 'saveLastRevalidatedAt' | 'fetchLimit'>;

let revalidating: Promise<Result<number, Error>> | undefined;

/**
 * v1.5.0 Victor Fernandez
 * The plan change notification cannot be relied on, so the limit is asked again to the backend, the source of truth,
 * before rejecting a file. Overlapping calls share the request in progress.
 */
export function revalidateFileSizeLimit({ saveLimit, saveLastRevalidatedAt, fetchLimit }: Props) {
  revalidating ??= fetchAndSaveLimit({ saveLimit, saveLastRevalidatedAt, fetchLimit }).finally(() => {
    revalidating = undefined;
  });

  return revalidating;
}

export function wasFileSizeLimitRevalidatedRecently({ getLastRevalidatedAt }: Pick<FileSizeLimitAdapter, 'getLastRevalidatedAt'>) {
  const lastRevalidatedAt = getLastRevalidatedAt();
  return lastRevalidatedAt !== undefined && Date.now() - lastRevalidatedAt < FILE_SIZE_LIMIT_REVALIDATION_INTERVAL_MS;
}

async function fetchAndSaveLimit({ saveLimit, saveLastRevalidatedAt, fetchLimit }: Props) {
  try {
    const res = await fetchLimit();

    if (Result.isError(res)) {
      logger.warn({ tag: 'SYNC-ENGINE', msg: 'Error revalidating user file size limit', error: res.error });
      return res;
    }

    saveLastRevalidatedAt({ timestamp: Date.now() });
    saveLimit({ limit: res.data });
    logger.debug({ tag: 'SYNC-ENGINE', msg: 'User file size limit revalidated', maxUploadFileSize: res.data });
    return res;
  } catch (error) {
    logger.warn({ tag: 'SYNC-ENGINE', msg: 'Error revalidating user file size limit', error });
    return Result.err(error instanceof Error ? error : new Error('Unexpected error revalidating user file size limit'));
  }
}
