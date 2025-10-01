export type CleanerState = {
  currentAbortController: AbortController | null;
  totalFilesToDelete: number;
  deletedFilesCount: number;
  totalSpaceGained: number;
  isCleanupInProgress: boolean;
};

function createInitialState(): CleanerState {
  return {
    currentAbortController: null,
    totalFilesToDelete: 0,
    deletedFilesCount: 0,
    totalSpaceGained: 0,
    isCleanupInProgress: false,
  };
}

const cleanerState: CleanerState = createInitialState();

function reset(): CleanerState {
  const newState = createInitialState();
  Object.assign(cleanerState, newState);
  return cleanerState;
}

export const cleanerStore = {
  get state() {
    return cleanerState;
  },
  reset,
} as const;
