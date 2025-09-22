import checkDiskSpace from 'check-disk-space';
import { describe, it, expect, vi } from 'vitest';

import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { deepMocked } from '@/tests/vitest/utils.helper.test';

import { getDiskSpace } from './get-disk-space';

vi.mock(import('check-disk-space'));

describe('getDiskSpace', () => {
  const checkDiskSpaceMock = deepMocked(checkDiskSpace);

  it('should return the disk size for the base path', async () => {
    // Given
    const mockDiskSpace = { size: 5000000000 };
    checkDiskSpaceMock.mockResolvedValue(mockDiskSpace);
    // When
    const result = await getDiskSpace({ mainPath: 'C:\\' });
    // Then
    expect(result).toBe(5000000000);
  });

  it('should return 0 and log an error if checkDiskSpace fails', async () => {
    // Given
    const mockError = new Error('Disk check failed');
    checkDiskSpaceMock.mockRejectedValue(mockError);
    // When
    const result = await getDiskSpace({ mainPath: '/' });
    // Then
    expect(result).toBe(0);
    expect(loggerMock.error).toHaveBeenCalledWith({ msg: 'Failed to get disk space', error: mockError });
  });
});
