export type SynchronizationPage<Item> = {
  items: Item[];
  nextCursor: string | null;
};

export type SynchronizationPageRequest =
  | {
      updatedAt: string;
      limit: number;
    }
  | {
      cursor: string;
      limit: number;
    };
export type SynchronizationTraversalState = {
  cursor: string | null;
  isInitial: boolean;
};
