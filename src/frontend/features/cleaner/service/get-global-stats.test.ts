import { CleanerReport, CleanerSectionKey } from '@/backend/features/cleaner/types/cleaner.types';
import { mockProps, updateProps } from '@/tests/vitest/utils.helper.test';

import { getGlobalStats } from './get-global-stats';

describe('getGlobalStats', () => {
  const sectionKeys: CleanerSectionKey[] = ['appCache', 'logFiles', 'trash'];

  const mockReportWithItems = {
    appCache: { items: [{ fullPath: '/cache/file1.txt' }, { fullPath: '/cache/file2.txt' }] },
    logFiles: { items: [{ fullPath: '/logs/log1.txt' }] },
    trash: { items: [] },
  };

  let props: Parameters<typeof getGlobalStats>[0];
  beforeEach(() => {
    props = mockProps<typeof getGlobalStats>({
      report: mockReportWithItems,
      sectionKeys,
    });
  });

  it('should return all selected when all non-empty sections are fully selected', () => {
    // Given
    props.viewModel = updateProps<typeof props.viewModel>({
      appCache: { selectedAll: true, exceptions: [] },
      logFiles: { selectedAll: true, exceptions: [] },
      trash: { selectedAll: true, exceptions: [] },
    });
    // When
    const result = getGlobalStats(props);
    // Then
    expect(result).toBe('all');
  });

  it('should return none selected when all non-empty sections have nothing selected', () => {
    // Given
    props.viewModel = updateProps<typeof props.viewModel>({
      appCache: { selectedAll: false, exceptions: [] },
      logFiles: { selectedAll: false, exceptions: [] },
      trash: { selectedAll: false, exceptions: [] },
    });
    // When
    const result = getGlobalStats(props);
    // Then
    expect(result).toBe('none');
  });

  it('should return partially selected when sections have mixed selection states', () => {
    // Given
    props.viewModel = updateProps<typeof props.viewModel>({
      appCache: { selectedAll: true, exceptions: [] },
      logFiles: { selectedAll: false, exceptions: [] },
      trash: { selectedAll: true, exceptions: [] },
    });
    // When
    const result = getGlobalStats(props);
    // Then
    expect(result).toBe('partial');
  });

  it('should return partially selected when at least one section is partially selected', () => {
    // Given
    props.viewModel = updateProps<typeof props.viewModel>({
      appCache: { selectedAll: true, exceptions: ['/cache/file1.txt'] },
      logFiles: { selectedAll: true, exceptions: [] },
      trash: { selectedAll: true, exceptions: [] },
    });
    // When
    const result = getGlobalStats(props);
    // Then
    expect(result).toBe('partial');
  });

  it('should return none selected when all sections are empty', () => {
    // Given
    props.viewModel = updateProps<typeof props.viewModel>({
      appCache: { selectedAll: true, exceptions: [] },
      logFiles: { selectedAll: true, exceptions: [] },
      trash: { selectedAll: true, exceptions: [] },
    });

    props.report = {
      appCache: { totalSizeInBytes: 0, items: [] },
      logFiles: { totalSizeInBytes: 0, items: [] },
      trash: { totalSizeInBytes: 0, items: [] },
    } as Partial<CleanerReport> as CleanerReport;
    // When
    const result = getGlobalStats(props);
    // Then
    expect(result).toBe('none');
  });

  it('should ignore empty sections when calculating global stats', () => {
    // Given
    props.report = updateProps<typeof props.report>({
      appCache: { items: [{ fullPath: '/cache/file1.txt' }] },
      logFiles: { items: [] },
      trash: { items: [] },
    });

    props.viewModel = updateProps<typeof props.viewModel>({
      appCache: { selectedAll: true, exceptions: [] },
      logFiles: { selectedAll: false, exceptions: [] },
      trash: { selectedAll: false, exceptions: [] },
    });
    // When
    const result = getGlobalStats(props);
    // Then
    expect(result).toBe('all');
  });
});
