import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { calls, partialSpyOn } from '@/tests/vitest/utils.helper.test';

import type { CleanerReport, CleanerSectionKey, CleanerViewModel } from '../types/cleaner.types';
import * as getAllItemsToDeleteModule from '../utils/selection-utils';
import { startCleanup, stopCleanup } from './cleanup-actions';
import * as deleteFileSafelyModule from './delete-file-saftly';

const mockedGetAllItemsToDelete = partialSpyOn(getAllItemsToDeleteModule, 'getAllItemsToDelete');
const mockedDeleteFileSafely = partialSpyOn(deleteFileSafelyModule, 'deleteFileSafely');

const createDelayedResolve = (delay: number) => () =>
  new Promise<{ success: boolean; size: number }>((resolve) => {
    const timeoutId = setTimeout(() => {
      resolve({ success: true, size: 400 });
    }, delay);
    return timeoutId;
  });

describe('cleanup-actions', () => {
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
    stopCleanup();
  });

  describe('startCleanup', () => {
    it('should complete cleanup process successfully', async () => {
      // Given
      const mockItemsToDelete = [
        { fullPath: '/cache/file1.tmp', fileName: 'file1.tmp', sizeInBytes: 400, absolutePath: '/cache/file1.tmp' },
        { fullPath: '/logs/app.log', fileName: 'app.log', sizeInBytes: 300, absolutePath: '/logs/app.log' },
      ];
      mockedGetAllItemsToDelete.mockReturnValue(mockItemsToDelete);
      mockedDeleteFileSafely.mockResolvedValueOnce({ success: true, size: 400 }).mockResolvedValueOnce({ success: true, size: 300 });
      // When
      await startCleanup({
        viewModel: mockViewModel,
        storedCleanerReport: mockStoredCleanerReport,
        emitProgress: mockEmitProgress,
        cleanerSectionKeys: mockCleanerSectionKeys,
      });
      // Then

      expect(mockedGetAllItemsToDelete).toHaveBeenCalledWith({
        viewModel: mockViewModel,
        report: mockStoredCleanerReport,
        cleanerSectionKeys: mockCleanerSectionKeys,
      });
      calls(mockedDeleteFileSafely).toHaveLength(2);
      expect(mockedDeleteFileSafely).toHaveBeenCalledWith({ absolutePath: '/cache/file1.tmp' });
      expect(mockedDeleteFileSafely).toHaveBeenCalledWith({ absolutePath: '/logs/app.log' });
      calls(mockEmitProgress).toMatchObject([
        {
          currentCleaningPath: '',
          progress: 0,
          deletedFiles: 0,
          spaceGained: 0,
          cleaning: true,
          cleaningCompleted: false,
        },
        {
          currentCleaningPath: 'file1.tmp',
          progress: 50,
          deletedFiles: 1,
          spaceGained: 400,
          cleaning: true,
          cleaningCompleted: false,
        },
        {
          currentCleaningPath: 'app.log',
          progress: 100,
          deletedFiles: 2,
          spaceGained: 700,
          cleaning: true,
          cleaningCompleted: false,
        },
        {
          currentCleaningPath: '',
          progress: 100,
          deletedFiles: 2,
          spaceGained: 700,
          cleaning: false,
          cleaningCompleted: true,
        },
      ]);

      calls(loggerMock.debug).toMatchObject([
        {
          tag: 'CLEANER',
          msg: 'Starting cleanup process',
          totalFiles: 2,
        },
        {
          tag: 'CLEANER',
          msg: 'Cleanup process finished',
          deletedFiles: 2,
          totalFiles: 2,
        },
      ]);
    });

    it('should handle partial deletion failures', async () => {
      // Given
      const mockItemsToDelete = [
        { fullPath: '/cache/file1.tmp', fileName: 'file1.tmp', sizeInBytes: 400, absolutePath: '/cache/file1.tmp' },
        { fullPath: '/logs/app.log', fileName: 'app.log', sizeInBytes: 300, absolutePath: '/logs/app.log' },
      ];
      mockedGetAllItemsToDelete.mockReturnValue(mockItemsToDelete);
      mockedDeleteFileSafely.mockResolvedValueOnce({ success: true, size: 400 }).mockResolvedValueOnce({ success: false, size: 0 });
      // When
      await startCleanup({
        viewModel: mockViewModel,
        storedCleanerReport: mockStoredCleanerReport,
        emitProgress: mockEmitProgress,
        cleanerSectionKeys: mockCleanerSectionKeys,
      });
      // Then
      calls(mockedDeleteFileSafely).toHaveLength(2);
      expect(mockEmitProgress).toBeCalledWith({
        currentCleaningPath: '',
        progress: 100,
        deletedFiles: 1,
        spaceGained: 400,
        cleaning: false,
        cleaningCompleted: true,
      });
    });

    it('should handle empty items to delete list', async () => {
      // Given
      mockedGetAllItemsToDelete.mockReturnValue([]);
      // When
      await startCleanup({
        viewModel: mockViewModel,
        storedCleanerReport: mockStoredCleanerReport,
        emitProgress: mockEmitProgress,
        cleanerSectionKeys: mockCleanerSectionKeys,
      });
      // Then
      expect(mockedDeleteFileSafely).not.toBeCalled();
      expect(mockEmitProgress).toBeCalledWith({
        currentCleaningPath: '',
        progress: 100,
        deletedFiles: 0,
        spaceGained: 0,
        cleaning: false,
        cleaningCompleted: true,
      });
    });

    it('should prevent concurrent cleanup processes', async () => {
      // Given
      const mockItemsToDelete = [
        { fullPath: '/cache/file1.tmp', fileName: 'file1.tmp', sizeInBytes: 400, absolutePath: '/cache/file1.tmp' },
      ];

      mockedGetAllItemsToDelete.mockReturnValue(mockItemsToDelete);
      mockedDeleteFileSafely.mockImplementation(createDelayedResolve(100));

      const newCleanup = startCleanup({
        viewModel: mockViewModel,
        storedCleanerReport: mockStoredCleanerReport,
        emitProgress: mockEmitProgress,
        cleanerSectionKeys: mockCleanerSectionKeys,
      });
      // When
      await startCleanup({
        viewModel: mockViewModel,
        storedCleanerReport: mockStoredCleanerReport,
        emitProgress: mockEmitProgress,
        cleanerSectionKeys: mockCleanerSectionKeys,
      });
      await newCleanup;
      // Then
      expect(loggerMock.warn).toHaveBeenCalledWith({
        tag: 'CLEANER',
        msg: 'Cleanup already in progress, ignoring new request',
      });
    });
  });

  describe('stopCleanup', () => {
    it('should stop running cleanup process', async () => {
      // Given
      const mockItemsToDelete = [
        { fullPath: '/cache/file1.tmp', fileName: 'file1.tmp', sizeInBytes: 400, absolutePath: '/cache/file1.tmp' },
        { fullPath: '/logs/app.log', fileName: 'app.log', sizeInBytes: 300, absolutePath: '/logs/app.log' },
      ];

      mockedGetAllItemsToDelete.mockReturnValue(mockItemsToDelete);
      mockedDeleteFileSafely.mockImplementation(createDelayedResolve(50));
      // When
      const cleanupPromise = startCleanup({
        viewModel: mockViewModel,
        storedCleanerReport: mockStoredCleanerReport,
        emitProgress: mockEmitProgress,
        cleanerSectionKeys: mockCleanerSectionKeys,
      });
      stopCleanup();
      await cleanupPromise;
      // Then
      expect(loggerMock.debug).toBeCalledWith({
        tag: 'CLEANER',
        msg: 'Stopping cleanup process',
      });

      expect(loggerMock.debug).toBeCalledWith({
        tag: 'CLEANER',
        msg: 'Cleanup process was aborted',
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
  });
});
