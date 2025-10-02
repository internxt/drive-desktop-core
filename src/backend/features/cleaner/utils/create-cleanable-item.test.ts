import { Stats } from 'node:fs';
import path from 'node:path';

import { AbsolutePath } from '@/backend/infra/file-system/file-system.types';
import { deepMocked } from '@/tests/vitest/utils.helper.test';

import { createCleanableItem } from './create-cleanable-item';

vi.mock(import('node:path'));

describe('createCleanableItem', () => {
  const mockedBasename = deepMocked(path.basename);

  it('should create a CleanableItem with correct properties', () => {
    // Given
    const mockStat = { size: 1024 } as Stats;
    const absolutePath = '/mock/path/example.txt' as AbsolutePath;
    mockedBasename.mockReturnValue('example.txt');
    // When
    const result = createCleanableItem({ absolutePath, stat: mockStat });
    // Then
    expect(result).toEqual({
      absolutePath,
      fileName: 'example.txt',
      sizeInBytes: 1024,
    });
  });
});
