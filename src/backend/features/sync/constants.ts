import type { AssertEqual } from '../../core/utils/assert-equal.types';
import { DriveItemStatus } from '../../infra/drive-item-status';
import type { operations } from '../../infra/schema';

type FilesSyncQueryStatus = NonNullable<
  operations['FileController_getFilesSync']['parameters']['query']
>['status'];

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- keeps sync query status aligned with DriveItemStatus
type _FilesSyncQueryStatusMatchesDriveItemStatus = AssertEqual<DriveItemStatus, FilesSyncQueryStatus>;

export type SynchronizationPage<Item> = {
  items: Item[];
  nextCursor: string | null;
};

export type SynchronizationPageRequest =
  | {
      updatedAt: string;
      limit: number;
      status?: DriveItemStatus;
    }
  | {
      cursor: string;
      limit: number;
      status?: DriveItemStatus;
    };
export type SynchronizationTraversalState = {
  cursor: string | null;
  isInitial: boolean;
};
