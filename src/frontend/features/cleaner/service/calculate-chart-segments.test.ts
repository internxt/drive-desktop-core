import type { CleanerViewModel } from '@/backend/features/cleaner/types/cleaner.types';
import { partialSpyOn } from '@/tests/vitest/utils.helper.test';

import { calculateChartSegments } from './calculate-chart-segments';
import * as calculateSectionSizeModule from './calculate-section-size';

describe('calculate-chart-segments', () => {
  const getSectionSelectionStats = vi.fn();
  const calculateSectionSizeMock = partialSpyOn(calculateSectionSizeModule, 'calculateSectionSize');

  const createMockReport = {
    appCache: {},
    logFiles: {},
    webCache: {},
  };

  const viewModel = { appCache: {}, logFiles: {}, webCache: {} };
  const sectionConfig = {
    appCache: { name: 'App Cache', color: '#FF6B6B' },
    logFiles: { name: 'Log Files', color: '#4ECDC4' },
    webCache: { name: 'Web Cache', color: '#45B7D1' },
  };

  it('should calculate segments correctly with no exceptions', () => {
    // Given
    getSectionSelectionStats.mockReturnValue(3);
    calculateSectionSizeMock.mockReturnValueOnce(1000).mockReturnValueOnce(2000).mockReturnValueOnce(1500);
    // When
    const result = calculateChartSegments({
      viewModel,
      report: createMockReport,
      totalSize: 4500,
      getSectionSelectionStats,
      sectionConfig,
    });
    // Then
    expect(result).toStrictEqual([
      {
        color: '#FF6B6B',
        percentage: (1000 / 4500) * 100,
        size: 1000,
      },
      {
        color: '#4ECDC4',
        percentage: (2000 / 4500) * 100,
        size: 2000,
      },
      {
        color: '#45B7D1',
        percentage: (1500 / 4500) * 100,
        size: 1500,
      },
    ]);
  });

  it('should subtract exceptions from total size', () => {
    // Given
    getSectionSelectionStats.mockReturnValue(1);
    calculateSectionSizeMock.mockReturnValueOnce(300).mockReturnValueOnce(0).mockReturnValueOnce(0);
    // When
    const result = calculateChartSegments({
      viewModel,
      report: createMockReport,
      totalSize: 4500,
      getSectionSelectionStats,
      sectionConfig,
    });
    // Then
    expect(result).toStrictEqual([{ color: '#FF6B6B', percentage: (300 / 4500) * 100, size: 300 }]);
  });

  it('should skip sections with no selected items', () => {
    // Given
    getSectionSelectionStats.mockReturnValue(1);
    calculateSectionSizeMock.mockReturnValueOnce(0).mockReturnValueOnce(2000).mockReturnValueOnce(0);
    // When
    const result = calculateChartSegments({
      viewModel,
      report: createMockReport,
      totalSize: 4500,
      getSectionSelectionStats,
      sectionConfig,
    });

    expect(result).toStrictEqual([{ color: '#4ECDC4', percentage: (2000 / 4500) * 100, size: 2000 }]);
  });

  it('should use default color when section config is missing', () => {
    // Given
    calculateSectionSizeMock.mockReturnValueOnce(1000);
    getSectionSelectionStats.mockReturnValue(1);
    const viewModel = { unknownSection: {} };
    const report = { unknownSection: {} };
    // When
    const result = calculateChartSegments({
      viewModel,
      report,
      totalSize: 1000,
      getSectionSelectionStats,
      sectionConfig,
    });
    // Then
    expect(result).toStrictEqual([{ color: '#6B7280', percentage: 100, size: 1000 }]);
  });

  it('should handle zero totalSize correctly', () => {
    // Given
    calculateSectionSizeMock.mockReturnValueOnce(1000);
    getSectionSelectionStats.mockReturnValue(1);
    const viewModel: CleanerViewModel = {
      appCache: {},
    };
    // When
    const result = calculateChartSegments({
      viewModel,
      report: createMockReport,
      totalSize: 0,
      getSectionSelectionStats,
      sectionConfig,
    });
    // Then
    expect(result).toStrictEqual([{ color: '#FF6B6B', percentage: 0, size: 1000 }]);
  });
});
