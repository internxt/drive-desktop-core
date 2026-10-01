import { Result } from '@/common/result';

import type { SynchronizationPage, SynchronizationPageRequest, SynchronizationTraversalState } from '../constants';
import { createSynchronizationTraversalState } from '../utils/create-synchronization-traversal-state';
import { generateSyncRequest } from '../utils/generate-sync-request';

export type SynchronizeRemoteItemsProps<Item> = {
  updatedAt: string;
  limit: number;
  fetchPage: (request: SynchronizationPageRequest) => Promise<Result<SynchronizationPage<Item>, Error>>;
  persistItems: ({ items }: { items: Item[] }) => Promise<Result<void>>;
};

export async function synchronizeRemoteItems<Item>(props: SynchronizeRemoteItemsProps<Item>): Promise<Result<void, Error>> {
  try {
    let state = createSynchronizationTraversalState();

    do {
      const pageResult = await synchronizePage({ props, state });

      if (Result.isError(pageResult)) {
        return Result.err(pageResult.error);
      }

      state = pageResult.data;
    } while (state.cursor !== null);

    return Result.ok(undefined);
  } catch (error) {
    return Result.err(error instanceof Error ? error : new Error('Unexpected synchronization error'));
  }
}

async function synchronizePage<Item>({
  props,
  state,
}: {
  props: SynchronizeRemoteItemsProps<Item>;
  state: SynchronizationTraversalState;
}): Promise<Result<SynchronizationTraversalState, Error>> {
  const requestResult = generateSyncRequest({
    isInitial: state.isInitial,
    cursor: state.cursor,
    updatedAt: props.updatedAt,
    limit: props.limit,
  });

  if (Result.isError(requestResult)) {
    return Result.err(requestResult.error);
  }

  const pageResult = await props.fetchPage(requestResult.data);

  if (Result.isError(pageResult)) {
    return Result.err(pageResult.error);
  }

  const persistResult = await props.persistItems({ items: pageResult.data.items });

  if (Result.isError(persistResult)) {
    return Result.err(persistResult.error);
  }

  return Result.ok(
    createSynchronizationTraversalState({
      cursor: pageResult.data.nextCursor,
      isInitial: false,
    }),
  );
}
