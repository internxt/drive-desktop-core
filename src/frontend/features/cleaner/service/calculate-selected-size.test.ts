import { describe, it, expect } from 'vitest';

import type { CleanerSection, CleanerViewModel } from '@/backend/features/cleaner/types/cleaner.types';

import { calculateSelectedSize } from './calculate-selected-size';

describe('calculateSelectedSize', () => {
  const createMockReport = (): Record<string, CleanerSection> => ({
    appCache: {
      totalSizeInBytes: 1000,
      items: [
        { fullPath: '/cache/file1.tmp', fileName: 'file1.tmp', sizeInBytes: 400 },
        { fullPath: '/cache/file2.tmp', fileName: 'file2.tmp', sizeInBytes: 300 },
        { fullPath: '/cache/file3.tmp', fileName: 'file3.tmp', sizeInBytes: 300 },
      ],
    },
    logFiles: {
      totalSizeInBytes: 2000,
      items: [
        { fullPath: '/logs/app.log', fileName: 'app.log', sizeInBytes: 800 },
        { fullPath: '/logs/error.log', fileName: 'error.log', sizeInBytes: 1200 },
      ],
    },
    webCache: {
      totalSizeInBytes: 1500,
      items: [{ fullPath: '/web/cache1', fileName: 'cache1', sizeInBytes: 1500 }],
    },
  });

  it('should return total size of all sections when no exceptions', () => {
    // Given
    const viewModel: CleanerViewModel = {
      appCache: { selectedAll: true, exceptions: [] },
      logFiles: { selectedAll: true, exceptions: [] },
      webCache: { selectedAll: true, exceptions: [] },
    };
    // When
    const result = calculateSelectedSize({ viewModel, report: createMockReport() });
    // Then
    expect(result).toBe(4500);
  });

  it('should subtract exception items from total size', () => {
    // Given
    const viewModel: CleanerViewModel = {
      appCache: { selectedAll: false, exceptions: ['/cache/file1.tmp', '/cache/file2.tmp'] },
      logFiles: { selectedAll: false, exceptions: ['/logs/error.log'] },
      webCache: { selectedAll: true, exceptions: [] },
    };
    // When
    const result = calculateSelectedSize({ viewModel, report: createMockReport() });
    // Then
    expect(result).toBe(3400);
  });

  it('should return 0 when no exceptions and selectedAll is false', () => {
    // Given
    const viewModel: CleanerViewModel = {
      appCache: { selectedAll: false, exceptions: [] },
      logFiles: { selectedAll: false, exceptions: [] },
      webCache: { selectedAll: false, exceptions: [] },
    };
    // When
    const result = calculateSelectedSize({ viewModel, report: createMockReport() });
    // Then
    expect(result).toBe(0);
  });

  it('should handle empty report', () => {
    // Given
    const viewModel: CleanerViewModel = {};
    const emptyReport: Record<string, CleanerSection> = {};
    // When
    const result = calculateSelectedSize({ viewModel, report: emptyReport });
    // Then
    expect(result).toBe(0);
  });
});
