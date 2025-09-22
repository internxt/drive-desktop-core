import { describe, it, expect, vi } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { createCleanableItem } from './create-cleanable-item';
import { deepMocked } from '@/tests/vitest/utils.helper.test';

vi.mock(import('fs'))
vi.mock(import('path'))

describe('createCleanableItem', () => {
    const mockedStat = deepMocked(fs.stat)
    const mockedBasename = deepMocked(path.basename)


    it('should create a CleanableItem with correct properties', async () => {
        const mockStat = { size: 1024 };
        mockedStat.mockResolvedValue(mockStat as any);
        mockedBasename.mockReturnValue('example.txt');

        const filePath = '/mock/path/example.txt';
        const result = await createCleanableItem(filePath);

        expect(result).toEqual({
            fullPath: filePath,
            fileName: 'example.txt',
            sizeInBytes: 1024,
        });
    });
});