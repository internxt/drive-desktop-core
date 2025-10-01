import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { partialSpyOn } from '@/tests/vitest/utils.helper.test';

import { cleanerStore } from '../stores/cleaner.store';
import type { CleanerReport, CleanerSectionKey, CleanerViewModel } from '../types/cleaner.types';
import * as getAllItemsToDeleteModule from '../utils/selection-utils';
import * as deleteFileSafelyModule from './delete-file-saftly';
import { startCleanup } from './start-cleanup';
import { stopCleanup } from './stop-cleanup';

const mockedGetAllItemsToDelete = partialSpyOn(getAllItemsToDeleteModule, 'getAllItemsToDelete');
const mockedDeleteFileSafely = partialSpyOn(deleteFileSafelyModule, 'deleteFileSafely');

describe('stopCleanup', () => {
  const mockEmitProgress = vi.fn();
  const mockCleanerSectionKeys: CleanerSectionKey[] = ['appCache', 'logFiles'];
  const mockViewModel: CleanerViewModel = {
    appCache: { selectedAll: true, exceptions: [] },
    logFiles: { selectedAll: true, exceptions: [] },
  };
  const mockStoredCleanerReport: CleanerReport = {
    appCache: {
      totalSizeInBytes: 1000,
      items: [{ fullPath: '/cache/file1.tmp', fileName: 'file1.tmp', sizeInBytes: 400 }],
    },
    logFiles: {
      totalSizeInBytes: 500,
      items: [{ fullPath: '/logs/app.log', fileName: 'app.log', sizeInBytes: 300 }],
    },
    trash: { totalSizeInBytes: 0, items: [] },
    webStorage: { totalSizeInBytes: 0, items: [] },
    webCache: { totalSizeInBytes: 0, items: [] },
  };

  beforeEach(() => {
    cleanerStore.reset();
    vi.clearAllMocks();
  });

  it('should stop running cleanup process', async () => {
    // Given
    const mockItemsToDelete = [
      { fullPath: '/cache/file1.tmp', fileName: 'file1.tmp', sizeInBytes: 400, absolutePath: '/cache/file1.tmp' },
      { fullPath: '/logs/app.log', fileName: 'app.log', sizeInBytes: 300, absolutePath: '/logs/app.log' },
    ];
    mockedGetAllItemsToDelete.mockReturnValue(mockItemsToDelete);
    mockedDeleteFileSafely.mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      cleanerStore.state.deletedFilesCount++;
      cleanerStore.state.totalSpaceGained += 400;
    });
    // When
    const cleanupPromise = startCleanup({
      viewModel: mockViewModel,
      storedCleanerReport: mockStoredCleanerReport,
      emitProgress: mockEmitProgress,
      cleanerSectionKeys: mockCleanerSectionKeys,
    });
    setTimeout(() => stopCleanup(), 25);
    await cleanupPromise;
    // Then
    expect(loggerMock.debug).toBeCalledWith({
      tag: 'CLEANER',
      msg: 'Stopping cleanup process',
    });
  });

  it('should handle stop when no cleanup is running', () => {
    // When
    stopCleanup();
    // Then
    expect(loggerMock.warn).toBeCalledWith({
      tag: 'CLEANER',
      msg: 'No cleanup process to stop',
    });
  });

  it('should handle stop when cleanup is not in progress but state exists', () => {
    // Given
    cleanerStore.state.isCleanupInProgress = false;
    cleanerStore.state.currentAbortController = null;
    // When
    stopCleanup();
    // Then
    expect(loggerMock.warn).toBeCalledWith({
      tag: 'CLEANER',
      msg: 'No cleanup process to stop',
    });
  });
});
