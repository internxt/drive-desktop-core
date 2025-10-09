import { CleanerReport, CleanerSectionKey, CleanerViewModel } from '@/backend/features/cleaner/types/cleaner.types';

import { getGlobalStats } from './get-global-stats';
import { mockProps } from '@/tests/vitest/utils.helper.test';

describe('getGlobalStats', () => {
  const sectionKeys: CleanerSectionKey[] = ['appCache', 'logFiles', 'trash'];

  const mockReportWithItems: CleanerReport = {
    appCache: {
      totalSizeInBytes: 1024,
      items: [
        { fullPath: '/cache/file1.txt', fileName: 'file1.txt', sizeInBytes: 512 },
        { fullPath: '/cache/file2.txt', fileName: 'file2.txt', sizeInBytes: 512 },
      ],
    },
    logFiles: {
      totalSizeInBytes: 2048,
      items: [{ fullPath: '/logs/log1.txt', fileName: 'log1.txt', sizeInBytes: 2048 }],
    },
    trash: { totalSizeInBytes: 0, items: [] },
  } as Partial<CleanerReport> as CleanerReport;

  let props: Parameters<typeof getGlobalStats>[0];
  beforeEach(() => {
    props = mockProps<typeof getGlobalStats>({
      viewModel: {},
      report: mockReportWithItems,
      sectionKeys,
    });
  });

  it('should return all selected when all non-empty sections are fully selected', () => {
    // Given
    props.viewModel = {
      appCache: { selectedAll: true, exceptions: [] },
      logFiles: { selectedAll: true, exceptions: [] },
      trash: { selectedAll: true, exceptions: [] },
    } as Partial<CleanerViewModel> as CleanerViewModel;
    // When
    const result = getGlobalStats(props);
    // Then
    expect(result).toMatchObject({
      isAllSelected: true,
      isPartiallySelected: false,
      isNoneSelected: false,
    });
  });

  it('should return none selected when all non-empty sections have nothing selected', () => {
    // Given
    props.viewModel = {
      appCache: { selectedAll: false, exceptions: [] },
      logFiles: { selectedAll: false, exceptions: [] },
      trash: { selectedAll: false, exceptions: [] },
    } as Partial<CleanerViewModel> as CleanerViewModel;
    // When
    const result = getGlobalStats(props);
    // Then
    expect(result).toMatchObject({
      isAllSelected: false,
      isPartiallySelected: false,
      isNoneSelected: true,
    });
  });

  it('should return partially selected when sections have mixed selection states', () => {
    // Given
    props.viewModel = {
      appCache: { selectedAll: true, exceptions: [] },
      logFiles: { selectedAll: false, exceptions: [] },
      trash: { selectedAll: true, exceptions: [] },
    } as Partial<CleanerViewModel> as CleanerViewModel;
    // When
    const result = getGlobalStats(props);
    // Then
    expect(result).toMatchObject({
      isAllSelected: false,
      isPartiallySelected: true,
      isNoneSelected: false,
    });
  });

  it('should return partially selected when at least one section is partially selected', () => {
    // Given
    props.viewModel = {
      appCache: { selectedAll: true, exceptions: ['/cache/file1.txt'] },
      logFiles: { selectedAll: true, exceptions: [] },
      trash: { selectedAll: true, exceptions: [] },
    } as Partial<CleanerViewModel> as CleanerViewModel;
    // When
    const result = getGlobalStats(props);
    // Then
    expect(result).toMatchObject({
      isAllSelected: false,
      isPartiallySelected: true,
      isNoneSelected: false,
    });
  });

  it('should return none selected when all sections are empty', () => {
    // Given
    props.viewModel = {
      appCache: { selectedAll: true, exceptions: [] },
      logFiles: { selectedAll: true, exceptions: [] },
      trash: { selectedAll: true, exceptions: [] },
    } as Partial<CleanerViewModel> as CleanerViewModel;

    props.report = {
        appCache: { totalSizeInBytes: 0, items: [] },
        logFiles: { totalSizeInBytes: 0, items: [] },
        trash: { totalSizeInBytes: 0, items: [] },
    } as Partial<CleanerReport> as CleanerReport;
    // When
    const result = getGlobalStats(props);
    // Then
    expect(result).toMatchObject({
      isAllSelected: false,
      isPartiallySelected: false,
      isNoneSelected: true,
    });
  });

  it('should ignore empty sections when calculating global stats', () => {
    // Given
    props.report = {
      appCache: {
        totalSizeInBytes: 1024,
        items: [{ fullPath: '/cache/file1.txt', fileName: 'file1.txt', sizeInBytes: 1024 }],
      },
      logFiles: { totalSizeInBytes: 0, items: [] },
      trash: { totalSizeInBytes: 0, items: [] },
    } as Partial<CleanerReport> as CleanerReport;

    props.viewModel = {
      appCache: { selectedAll: true, exceptions: [] },
      logFiles: { selectedAll: false, exceptions: [] },
      trash: { selectedAll: false, exceptions: [] },
    } as Partial<CleanerViewModel> as CleanerViewModel;
    // When
    const result = getGlobalStats(props);
    // Then
    expect(result).toMatchObject({
      isAllSelected: true,
      isPartiallySelected: false,
      isNoneSelected: false,
    });
  });
});
