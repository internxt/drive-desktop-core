import type { operations } from '../../infra/schema';

export type SynchronizationPage<Item> = {
  items: Item[];
  nextCursor: string | null;
};

export type SynchronizationPageRequest =
  | {
      updatedAt: string;
      limit: number;
      status?: NonNullable<operations['FileController_getFilesSync']['parameters']['query']>['status'];
    }
  | {
      cursor: string;
      limit: number;
    };
export type SynchronizationTraversalState = {
  cursor: string | null;
  isInitial: boolean;
};
