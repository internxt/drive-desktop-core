import { logger } from '@/backend/core/logger/logger';
import { Result } from '@/common/result';

import { FILE_SIZE_LIMIT_REVALIDATION_INTERVAL_MS } from '../constants';
import { FileSizeLimitAdapter } from '../file-size-limit.types';

type Props = Pick<FileSizeLimitAdapter, 'saveLimit' | 'fetchLimit'>;

let revalidating: Promise<Result<number, Error>> | undefined;
let lastRevalidatedAt: number | undefined;

/**
 * v1.5.0 Victor Fernandez
 * The plan change notification cannot be relied on, so the limit is asked again to the backend, the source of truth,
 * before rejecting a file. Overlapping calls share the request in progress.
 */
export function revalidateFileSizeLimit({ saveLimit, fetchLimit }: Props) {
  revalidating ??= fetchAndSaveLimit({ saveLimit, fetchLimit }).finally(() => {
    revalidating = undefined;
  });

  return revalidating;
}

export function wasFileSizeLimitRevalidatedRecently() {
  return lastRevalidatedAt !== undefined && Date.now() - lastRevalidatedAt < FILE_SIZE_LIMIT_REVALIDATION_INTERVAL_MS;
}

export function resetFileSizeLimitRevalidation() {
  lastRevalidatedAt = undefined;
}

async function fetchAndSaveLimit({ saveLimit, fetchLimit }: Props) {
  try {
    const res = await fetchLimit();

    if (Result.isError(res)) {
      logger.warn({ tag: 'SYNC-ENGINE', msg: 'Error revalidating user file size limit', error: res.error });
      return res;
    }

    lastRevalidatedAt = Date.now();
    saveLimit({ limit: res.data });
    logger.debug({ tag: 'SYNC-ENGINE', msg: 'User file size limit revalidated', maxUploadFileSize: res.data });
    return res;
  } catch (error) {
    logger.warn({ tag: 'SYNC-ENGINE', msg: 'Error revalidating user file size limit', error });
    return Result.err(error instanceof Error ? error : new Error('Unexpected error revalidating user file size limit'));
  }
}
