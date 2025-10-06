import { cleanerStore } from './cleaner.store';

describe('cleanerStore', () => {
  it('should have correct initial state', () => {
    expect(cleanerStore.state).toStrictEqual({
      currentAbortController: null,
      totalFilesToDelete: 0,
      deletedFilesCount: 0,
      totalSpaceGained: 0,
      isCleanupInProgress: false,
    });
  });

  it('should reset all state to initial values', () => {
    // Given
    const abortController = new AbortController();
    cleanerStore.state.currentAbortController = abortController;
    cleanerStore.state.totalFilesToDelete = 10;
    cleanerStore.state.deletedFilesCount = 5;
    cleanerStore.state.totalSpaceGained = 1024;
    cleanerStore.state.isCleanupInProgress = true;
    // When
    cleanerStore.reset();
    // Then
    expect(cleanerStore.state).toStrictEqual({
      currentAbortController: null,
      totalFilesToDelete: 0,
      deletedFilesCount: 0,
      totalSpaceGained: 0,
      isCleanupInProgress: false,
    });
  });
});
