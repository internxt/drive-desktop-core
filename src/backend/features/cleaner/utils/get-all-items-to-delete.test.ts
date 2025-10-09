import { mockProps } from '@/tests/vitest/utils.helper.test';

import { CleanableItem, CleanerViewModel } from '../types/cleaner.types';
import { getAllItemsToDelete } from './get-all-items-to-delete';

describe('getAllItemsToDelete', () => {
  const mockItems1: CleanableItem[] = [
    { fullPath: '/cache/file1.txt', fileName: 'file1.txt', sizeInBytes: 1024 },
    { fullPath: '/cache/file2.txt', fileName: 'file2.txt', sizeInBytes: 2048 },
  ];

  const mockItems2: CleanableItem[] = [
    { fullPath: '/logs/log1.txt', fileName: 'log1.txt', sizeInBytes: 512 },
    { fullPath: '/logs/log2.txt', fileName: 'log2.txt', sizeInBytes: 256 },
  ];

  const mockItems3: CleanableItem[] = [{ fullPath: '/trash/deleted1.txt', fileName: 'deleted1.txt', sizeInBytes: 4096 }];

  let props: Parameters<typeof getAllItemsToDelete>[0];
  beforeEach(() => {
    props = mockProps<typeof getAllItemsToDelete>({
      report: {
        appCache: { totalSizeInBytes: 3072, items: mockItems1 },
        logFiles: { totalSizeInBytes: 768, items: mockItems2 },
        trash: { totalSizeInBytes: 4096, items: mockItems3 },
      },
      viewModel: {} as Partial<CleanerViewModel> as CleanerViewModel,
      cleanerSectionKeys: ['appCache', 'logFiles', 'trash'],
    });
  });

  it('should return all selected items from all sections', () => {
    // Given
    const viewModel: CleanerViewModel = {
      appCache: { selectedAll: true, exceptions: [] },
      logFiles: { selectedAll: true, exceptions: [] },
      trash: { selectedAll: true, exceptions: [] },
    } as Partial<CleanerViewModel> as CleanerViewModel;
    props.viewModel = viewModel;
    // When
    const result = getAllItemsToDelete(props);
    // Then
    expect(result).toHaveLength(5);
    expect(result).toMatchObject([...mockItems1, ...mockItems2, ...mockItems3]);
  });

  it('should respect exceptions when selectedAll is true', () => {
    // Given
    const viewModel: CleanerViewModel = {
      appCache: { selectedAll: true, exceptions: ['/cache/file1.txt'] },
      logFiles: { selectedAll: true, exceptions: ['/logs/log2.txt'] },
      trash: { selectedAll: true, exceptions: [] },
    } as Partial<CleanerViewModel> as CleanerViewModel;
    props.viewModel = viewModel;
    // When
    const result = getAllItemsToDelete(props);
    // Then
    expect(result).toHaveLength(3);
    expect(result).toMatchObject([{ fullPath: '/cache/file2.txt' }, { fullPath: '/logs/log1.txt' }, { fullPath: '/trash/deleted1.txt' }]);
  });

  it('should return only explicitly selected items when selectedAll is false', () => {
    // Given
    const viewModel: CleanerViewModel = {
      appCache: { selectedAll: false, exceptions: ['/cache/file1.txt'] },
      logFiles: { selectedAll: false, exceptions: ['/logs/log2.txt'] },
      trash: { selectedAll: false, exceptions: [] },
    } as Partial<CleanerViewModel> as CleanerViewModel;
    props.viewModel = viewModel;
    // When
    const result = getAllItemsToDelete(props);
    // Then
    expect(result).toHaveLength(2);
    expect(result).toMatchObject([{ fullPath: '/cache/file1.txt' }, { fullPath: '/logs/log2.txt' }]);
  });

  it('should return empty array when no sections are selected', () => {
    // Given
    const viewModel: CleanerViewModel = {
      appCache: { selectedAll: false, exceptions: [] },
      logFiles: { selectedAll: false, exceptions: [] },
      trash: { selectedAll: false, exceptions: [] },
    } as Partial<CleanerViewModel> as CleanerViewModel;
    props.viewModel = viewModel;
    // When
    const result = getAllItemsToDelete(props);
    // Then
    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it('should handle mixed selection states across different sections', () => {
    // Given
    const viewModel: CleanerViewModel = {
      appCache: { selectedAll: true, exceptions: ['/cache/file2.txt'] },
      logFiles: { selectedAll: false, exceptions: ['/logs/log1.txt'] },
      trash: { selectedAll: true, exceptions: [] },
    } as Partial<CleanerViewModel> as CleanerViewModel;
    props.viewModel = viewModel;
    // When
    const result = getAllItemsToDelete(props);
    // Then
    expect(result).toHaveLength(3);
    expect(result).toMatchObject([{ fullPath: '/cache/file1.txt' }, { fullPath: '/logs/log1.txt' }, { fullPath: '/trash/deleted1.txt' }]);
  });
});
