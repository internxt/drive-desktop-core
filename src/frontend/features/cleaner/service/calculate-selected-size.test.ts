import { describe, it, expect } from 'vitest';

import { mockProps } from '@/tests/vitest/utils.helper.test';

import { calculateSelectedSize } from './calculate-selected-size';

describe('calculate-selected-size', () => {
  let props: Parameters<typeof calculateSelectedSize>[0];

  beforeEach(() => {
    props = mockProps<typeof calculateSelectedSize>({
      viewModel: {
        appCache: { selectedAll: true, exceptions: [] },
        logFiles: { selectedAll: true, exceptions: [] },
        webCache: { selectedAll: true, exceptions: [] },
      },
      report: {
        appCache: {
          totalSizeInBytes: 1000,
          items: [
            { fullPath: '/cache/file1.tmp', sizeInBytes: 400 },
            { fullPath: '/cache/file2.tmp', sizeInBytes: 300 },
            { fullPath: '/cache/file3.tmp', sizeInBytes: 300 },
          ],
        },
        logFiles: {
          totalSizeInBytes: 2000,
          items: [
            { fullPath: '/logs/app.log', sizeInBytes: 800 },
            { fullPath: '/logs/error.log', sizeInBytes: 1200 },
          ],
        },
        webCache: {
          totalSizeInBytes: 1500,
          items: [{ fullPath: '/web/cache1', sizeInBytes: 1500 }],
        },
      },
    });
  });

  it('should return total size of all sections when no exceptions', () => {
    // When
    const result = calculateSelectedSize(props);
    // Then
    expect(result).toBe(4500);
  });

  it('should subtract exception items from total size', () => {
    // Given
    props.viewModel.appCache.selectedAll = false;
    props.viewModel.appCache.exceptions = ['/cache/file1.tmp', '/cache/file2.tmp'];
    props.viewModel.logFiles.selectedAll = false;
    props.viewModel.logFiles.exceptions = ['/logs/error.log'];
    // When
    const result = calculateSelectedSize(props);
    // Then
    expect(result).toBe(3400);
  });

  it('should return 0 when no exceptions and selectedAll is false', () => {
    // Given
    props.viewModel.appCache.selectedAll = false;
    props.viewModel.logFiles.selectedAll = false;
    props.viewModel.webCache.selectedAll = false;
    // When
    const result = calculateSelectedSize(props);
    // Then
    expect(result).toBe(0);
  });
});
