import { Stats } from 'node:fs';
import path from 'node:path';

import { deepMocked } from '@/tests/vitest/utils.helper.test';

import { createCleanableItem } from './create-cleanable-item';

vi.mock(import('node:path'));

describe('createCleanableItem', () => {
  const mockedBasename = deepMocked(path.basename);

  it('should create a CleanableItem with correct properties', () => {
    // Given
    const mockStat = { size: 1024 } as Stats;
    const absolutePath = '/mock/path/example.txt';
    mockedBasename.mockReturnValue('example.txt');
    // When
    const result = createCleanableItem({ absolutePath, stat: mockStat });
    // Then
    expect(result).toStrictEqual({
      fullPath: absolutePath,
      fileName: 'example.txt',
      sizeInBytes: 1024,
    });
  });
});
