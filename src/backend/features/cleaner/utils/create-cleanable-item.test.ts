import { Stats } from 'fs';
import path from 'path';

import { deepMocked } from '@/tests/vitest/utils.helper.test';

import { createCleanableItem } from './create-cleanable-item';

vi.mock(import('path'));

describe('createCleanableItem', () => {
  const mockedBasename = deepMocked(path.basename);

  it('should create a CleanableItem with correct properties', () => {
    const mockStat = { size: 1024 } as Stats;
    mockedBasename.mockReturnValue('example.txt');

    const filePath = '/mock/path/example.txt';
    const result = createCleanableItem({ filePath, stat: mockStat });

    expect(result).toEqual({
      fullPath: filePath,
      fileName: 'example.txt',
      sizeInBytes: 1024,
    });
  });
});
