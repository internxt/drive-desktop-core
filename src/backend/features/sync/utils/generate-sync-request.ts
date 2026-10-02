import { Result } from '../../../../common/result';
import type { SynchronizationPageRequest } from '../constants';
import { isUpdatedAtEpoch } from './is-updated-at-epoch';

export type GenerateSyncRequestProps = {
  isInitial: boolean;
  cursor: string | null;
  updatedAt: string;
  limit: number;
};

export function generateSyncRequest({
  isInitial,
  cursor,
  updatedAt,
  limit,
}: GenerateSyncRequestProps): Result<SynchronizationPageRequest, Error> {
  if (isInitial) {
    const request: SynchronizationPageRequest = {
      updatedAt,
      limit,
      status: isUpdatedAtEpoch(updatedAt) ? 'EXISTS' : undefined,
    };

    return Result.ok(request);
  }

  if (cursor === null) {
    return Result.err(new Error('Cannot synchronize a completed traversal'));
  }

  return Result.ok({ cursor, limit });
}
