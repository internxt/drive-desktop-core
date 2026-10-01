import { Result } from '../../../../common/result';
import type { SynchronizationPageRequest } from '../constants';

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
    return Result.ok({ updatedAt, limit });
  }

  if (cursor === null) {
    return Result.err(new Error('Cannot synchronize a completed traversal'));
  }

  return Result.ok({ cursor, limit });
}
