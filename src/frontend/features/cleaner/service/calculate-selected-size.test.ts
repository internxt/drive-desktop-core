import { describe, it, expect } from 'vitest';

import type { CleanerSection, CleanerViewModel } from '@/backend/features/cleaner/types/cleaner.types';
import { AbsolutePath } from '@/backend/infra/file-system/file-system.module';

import { calculateSelectedSize } from './calculate-selected-size';

describe('calculateSelectedSize', () => {
  const createMockReport = (): Record<string, CleanerSection> => ({
    appCache: {
      totalSizeInBytes: 1000,
      items: [
        { absolutePath: '/cache/file1.tmp' as AbsolutePath, fileName: 'file1.tmp', sizeInBytes: 400 },
        { absolutePath: '/cache/file2.tmp' as AbsolutePath, fileName: 'file2.tmp', sizeInBytes: 300 },
        { absolutePath: '/cache/file3.tmp' as AbsolutePath, fileName: 'file3.tmp', sizeInBytes: 300 },
      ],
    },
    logFiles: {
      totalSizeInBytes: 2000,
      items: [
        { absolutePath: '/logs/app.log' as AbsolutePath, fileName: 'app.log', sizeInBytes: 800 },
        { absolutePath: '/logs/error.log' as AbsolutePath, fileName: 'error.log', sizeInBytes: 1200 },
      ],
    },
    webCache: {
      totalSizeInBytes: 1500,
      items: [{ absolutePath: '/web/cache1' as AbsolutePath, fileName: 'cache1', sizeInBytes: 1500 }],
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
