import { describe, it, expect } from 'vitest';

import type { CleanerSectionViewModel } from '@/backend/features/cleaner/types/cleaner.types';
import { AbsolutePath } from '@/backend/infra/file-system/file-system.types';

import { getSectionStats } from './get-section-stats';

describe('getSectionStats', () => {
  const mockItems = [
    { absolutePath: '/path/to/file1.txt' as AbsolutePath },
    { absolutePath: '/path/to/file2.txt' as AbsolutePath },
    { absolutePath: '/path/to/file3.txt' as AbsolutePath },
    { absolutePath: '/path/to/file4.txt' as AbsolutePath },
  ];

  it('should return stats indicating no items', () => {
    // Given
    const viewModel: CleanerSectionViewModel = {
      selectedAll: true,
      exceptions: [],
    };
    // When
    const result = getSectionStats({ viewModel, allItems: [] });
    // Then
    expect(result).toMatchObject({
      selectedCount: 0,
      totalCount: 0,
      isAllSelected: false,
      isPartiallySelected: false,
      isNoneSelected: true,
    });
  });

  it('should return all selected when no exceptions', () => {
    // Given
    const viewModel: CleanerSectionViewModel = {
      selectedAll: true,
      exceptions: [],
    };
    // When
    const result = getSectionStats({ viewModel, allItems: mockItems });
    // Then
    expect(result).toMatchObject({
      selectedCount: 4,
      totalCount: 4,
      isAllSelected: true,
      isPartiallySelected: false,
      isNoneSelected: false,
    });
  });

  it('should return partially selected when some exceptions exist', () => {
    // Given
    const viewModel: CleanerSectionViewModel = {
      selectedAll: true,
      exceptions: ['/path/to/file2.txt', '/path/to/file4.txt'] as AbsolutePath[],
    };
    // When
    const result = getSectionStats({ viewModel, allItems: mockItems });
    // Then
    expect(result).toMatchObject({
      selectedCount: 2,
      totalCount: 4,
      isAllSelected: false,
      isPartiallySelected: true,
      isNoneSelected: false,
    });
  });

  it('should return none selected when all items are exceptions', () => {
    // Given
    const viewModel: CleanerSectionViewModel = {
      selectedAll: true,
      exceptions: ['/path/to/file1.txt', '/path/to/file2.txt', '/path/to/file3.txt', '/path/to/file4.txt'] as AbsolutePath[],
    };
    // When
    const result = getSectionStats({ viewModel, allItems: mockItems });
    // Then
    expect(result).toMatchObject({
      selectedCount: 0,
      totalCount: 4,
      isAllSelected: false,
      isPartiallySelected: false,
      isNoneSelected: true,
    });
  });
});
