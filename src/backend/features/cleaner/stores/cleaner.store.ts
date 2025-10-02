type CleanerState = {
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

const state: CleanerState = createInitialState();

function reset() {
  const newState = createInitialState();
  Object.assign(state, newState);
}

export const cleanerStore = {
  state,
  reset,
} as const;
