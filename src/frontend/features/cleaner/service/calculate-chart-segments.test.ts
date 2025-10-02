import { AbsolutePath } from '@/backend';
import type { CleanerSection, CleanerViewModel } from '@/backend/features/cleaner/types/cleaner.types';

import { calculateChartSegments } from './calculate-chart-segments';

describe('calculateChartSegments', () => {
  const createMockReport = {
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
  };

  const createMockSectionConfig = {
    appCache: { name: 'App Cache', color: '#FF6B6B' },
    logFiles: { name: 'Log Files', color: '#4ECDC4' },
    webCache: { name: 'Web Cache', color: '#45B7D1' },
  };

  const getSectionSelectionStatsMock = ({
    selectedCount,
    totalCount,
    isAllSelected,
  }: {
    selectedCount: number;
    totalCount: number;
    isAllSelected: boolean;
  }) =>
    vi.fn(() => {
      return {
        selectedCount,
        totalCount,
        isAllSelected,
        isPartiallySelected: !isAllSelected && selectedCount > 0,
        isNoneSelected: selectedCount === 0,
      };
    });

  it('should calculate segments correctly with no exceptions', () => {
    // Given
    const viewModel: CleanerViewModel = {
      appCache: { selectedAll: true, exceptions: [] },
      logFiles: { selectedAll: true, exceptions: [] },
      webCache: { selectedAll: true, exceptions: [] },
    };
    const getSectionSelectionStats = getSectionSelectionStatsMock({ selectedCount: 3, totalCount: 3, isAllSelected: true });
    // When
    const result = calculateChartSegments({
      viewModel,
      report: createMockReport,
      totalSize: 4500,
      getSectionSelectionStats,
      sectionConfig: createMockSectionConfig,
    });
    // Then
    expect(result).toMatchObject([
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
    const viewModelSingle: CleanerViewModel = {
      appCache: { selectedAll: true, exceptions: ['/cache/file1.tmp', '/cache/file2.tmp'] },
      logFiles: { selectedAll: false, exceptions: [] },
      webCache: { selectedAll: false, exceptions: [] },
    };
    const getSectionSelectionStats = getSectionSelectionStatsMock({ selectedCount: 1, totalCount: 3, isAllSelected: false });
    // When
    const result = calculateChartSegments({
      viewModel: viewModelSingle,
      report: createMockReport,
      totalSize: 4500,
      getSectionSelectionStats,
      sectionConfig: createMockSectionConfig,
    });
    // Then
    expect(result).toMatchObject([
      {
        color: '#FF6B6B',
        percentage: (300 / 4500) * 100,
        size: 300,
      },
    ]);
  });

  it('should skip sections with no selected items', () => {
    // Given
    const viewModel: CleanerViewModel = {
      appCache: { selectedAll: false, exceptions: [] },
      logFiles: { selectedAll: true, exceptions: [] },
      webCache: { selectedAll: false, exceptions: [] },
    };
    const getSectionSelectionStats = getSectionSelectionStatsMock({ selectedCount: 1, totalCount: 3, isAllSelected: false });
    // When
    const result = calculateChartSegments({
      viewModel,
      report: createMockReport,
      totalSize: 4500,
      getSectionSelectionStats,
      sectionConfig: createMockSectionConfig,
    });

    expect(result).toMatchObject([
      {
        color: '#4ECDC4',
        percentage: (2000 / 4500) * 100,
        size: 2000,
      },
    ]);
  });

  it('should use default color when section config is missing', () => {
    // Given
    const viewModel: CleanerViewModel = {
      unknownSection: { selectedAll: true, exceptions: [] },
    };
    const report: Record<string, CleanerSection> = {
      unknownSection: {
        totalSizeInBytes: 1000,
        items: [{ absolutePath: '/test' as AbsolutePath, fileName: 'test', sizeInBytes: 1000 }],
      },
    };
    const getSectionSelectionStats = getSectionSelectionStatsMock({ selectedCount: 1, totalCount: 1, isAllSelected: true });
    // When
    const result = calculateChartSegments({
      viewModel,
      report,
      totalSize: 1000,
      getSectionSelectionStats,
      sectionConfig: createMockSectionConfig,
    });
    // Then
    expect(result).toHaveLength(1);
    expect(result[0]!.color).toBe('#6B7280');
  });

  it('should handle zero totalSize correctly', () => {
    // Given
    const viewModel: CleanerViewModel = {
      appCache: { selectedAll: true, exceptions: [] },
    };
    const getSectionSelectionStats = getSectionSelectionStatsMock({ selectedCount: 1, totalCount: 1, isAllSelected: true });
    // When
    const result = calculateChartSegments({
      viewModel,
      report: createMockReport,
      totalSize: 0,
      getSectionSelectionStats,
      sectionConfig: createMockSectionConfig,
    });
    // Then
    expect(result).toHaveLength(1);
    expect(result[0]!.percentage).toBe(0);
  });
});
