import { unlink } from 'node:fs/promises';

import { FileSystemModule } from '@/backend/infra/file-system/file-system.module';
import type { AbsolutePath } from '@/backend/infra/file-system/file-system.types';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { deepMocked, partialSpyOn } from '@/tests/vitest/utils.helper.test';

import { cleanerStore } from '../stores/cleaner.store';
import { deleteFileSafely } from './delete-file-saftly';

vi.mock(import('node:fs/promises'));

const mockedUnlink = deepMocked(unlink);
const mockedStat = partialSpyOn(FileSystemModule, 'stat');

describe('deleteFileSafely', () => {
  const testFilePath = '/test/path/file.txt' as AbsolutePath;

  beforeEach(() => {
    cleanerStore.reset();
  });

  it('should delete file successfully and update store', async () => {
    // Given
    mockedStat.mockResolvedValue({
      data: { size: 1024 },
    });
    mockedUnlink.mockResolvedValue(undefined);
    // When
    await deleteFileSafely({ absolutePath: testFilePath });
    // Then
    expect(mockedStat).toBeCalledWith({ absolutePath: testFilePath });
    expect(mockedUnlink).toBeCalledWith(testFilePath);
    expect(cleanerStore.state.deletedFilesCount).toBe(1);
    expect(cleanerStore.state.totalSpaceGained).toBe(1024);
    expect(loggerMock.warn).not.toBeCalled();
  });

  it('should handle stat error gracefully', async () => {
    // Given
    mockedStat.mockResolvedValue({
      error: new Error('File not found'),
    });
    // When
    await deleteFileSafely({ absolutePath: testFilePath });
    // Then
    expect(mockedStat).toBeCalledWith({ absolutePath: testFilePath });
    expect(mockedUnlink).not.toBeCalled();
    expect(cleanerStore.state.deletedFilesCount).toBe(0);
    expect(cleanerStore.state.totalSpaceGained).toBe(0);

    expect(loggerMock.warn).toBeCalledWith({
      tag: 'CLEANER',
      msg: 'Failed to delete file, could not retrieve file stats',
      filePath: testFilePath,
    });
  });

  it('should handle unlink error gracefully', async () => {
    // Given
    mockedStat.mockResolvedValue({
      data: { size: 512 },
    });
    const unlinkError = new Error('Permission denied');
    mockedUnlink.mockRejectedValue(unlinkError);
    // When
    await deleteFileSafely({ absolutePath: testFilePath });
    // Then
    expect(mockedStat).toBeCalledWith({ absolutePath: testFilePath });
    expect(mockedUnlink).toBeCalledWith(testFilePath);
    expect(cleanerStore.state.deletedFilesCount).toBe(0);
    expect(cleanerStore.state.totalSpaceGained).toBe(0);

    expect(loggerMock.warn).toBeCalledWith({
      msg: 'Failed to delete file, continuing with next file',
      absolutePath: testFilePath,
      error: expect.objectContaining({
        message: 'Permission denied',
      }),
    });
  });
});
