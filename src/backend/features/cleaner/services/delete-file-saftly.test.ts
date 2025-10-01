import { unlink } from 'node:fs/promises';

import { FileSystemModule } from '@/backend/infra/file-system/file-system.module';
import type { AbsolutePath } from '@/backend/infra/file-system/file-system.types';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { deepMocked, partialSpyOn } from '@/tests/vitest/utils.helper.test';

import { deleteFileSafely } from './delete-file-saftly';

vi.mock('node:fs/promises');

const mockedUnlink = deepMocked(unlink);
const mockedStat = partialSpyOn(FileSystemModule, 'stat');

describe('deleteFileSafely', () => {
  const testFilePath = '/test/path/file.txt' as AbsolutePath;

  it('should delete file successfully and return file size', async () => {
    // Given
    mockedStat.mockResolvedValue({
      data: { size: 1024 },
    });
    mockedUnlink.mockResolvedValue(undefined);
    // When
    const result = await deleteFileSafely({ absolutePath: testFilePath });
    // Then
    expect(mockedStat).toBeCalledWith({ absolutePath: testFilePath });
    expect(mockedUnlink).toBeCalledWith(testFilePath);
    expect(result).toEqual({
      success: true,
      size: 1024,
    });
    expect(loggerMock.warn).not.toBeCalled();
  });

  it('should handle stat error gracefully', async () => {
    // Given
    mockedStat.mockResolvedValue({
      error: new Error('File not found'),
    });
    // When
    const result = await deleteFileSafely({ absolutePath: testFilePath });
    // Then
    expect(mockedStat).toBeCalledWith({ absolutePath: testFilePath });
    expect(mockedUnlink).not.toBeCalled();
    expect(result).toEqual({
      success: false,
      size: 0,
    });

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
    const result = await deleteFileSafely({ absolutePath: testFilePath });
    // Then
    expect(mockedStat).toBeCalledWith({ absolutePath: testFilePath });
    expect(mockedUnlink).toBeCalledWith(testFilePath);
    expect(result).toEqual({
      success: false,
      size: 0,
    });

    expect(loggerMock.warn).toBeCalledWith({
      msg: 'Failed to delete file, continuing with next file',
      absolutePath: testFilePath,
      error: 'Permission denied',
    });
  });
});
