import { mockProps } from '@/tests/vitest/utils.helper.test';

import { CleanableItem } from '../types/cleaner.types';
import { getSelectedItemsForSection } from './get-selected-items-for-section';

describe('getSelectedItemsForSection', () => {
  const mockItems: CleanableItem[] = [
    { fullPath: '/path/to/file1.txt', fileName: 'file1.txt', sizeInBytes: 1024 },
    { fullPath: '/path/to/file2.txt', fileName: 'file2.txt', sizeInBytes: 2048 },
    { fullPath: '/path/to/file3.txt', fileName: 'file3.txt', sizeInBytes: 512 },
    { fullPath: '/path/to/file4.txt', fileName: 'file4.txt', sizeInBytes: 4096 },
  ];

  let props: Parameters<typeof getSelectedItemsForSection>[0];
  beforeEach(() => {
    props = mockProps<typeof getSelectedItemsForSection>({
      sectionViewModel: {
        selectedAll: true,
        exceptions: [],
      },
      sectionItems: mockItems,
    });
  });

  describe('when selectedAll is true', () => {
    it('should return all items when there are no exceptions', () => {
      // When
      const result = getSelectedItemsForSection(props);
      // Then
      expect(result).toHaveLength(4);
      expect(result).toMatchObject(mockItems);
    });

    it('should exclude items that are in exceptions', () => {
      // Given
      props.sectionViewModel.exceptions = ['/path/to/file2.txt', '/path/to/file4.txt'];
      // When
      const result = getSelectedItemsForSection(props);
      // Then
      expect(result).toHaveLength(2);
      expect(result).toMatchObject([mockItems[0], mockItems[2]]);
    });
  });

  describe('when selectedAll is false', () => {
    it('should return empty array when there are no exceptions', () => {
      // Given
      props.sectionViewModel.selectedAll = false;
      // When
      const result = getSelectedItemsForSection(props);
      // Then
      expect(result).toHaveLength(0);
      expect(result).toMatchObject([]);
    });

    it('should return only items that are in exceptions', () => {
      // Given
      props.sectionViewModel.selectedAll = false;
      props.sectionViewModel.exceptions = ['/path/to/file1.txt', '/path/to/file3.txt'];
      // When
      const result = getSelectedItemsForSection(props);
      // Then
      expect(result).toHaveLength(2);
      expect(result).toMatchObject([mockItems[0], mockItems[2]]);
    });

    it('should return all items when all paths are in exceptions', () => {
      // Given
      props.sectionViewModel.selectedAll = false;
      props.sectionViewModel.exceptions = ['/path/to/file1.txt', '/path/to/file2.txt', '/path/to/file3.txt', '/path/to/file4.txt'];
      // When
      const result = getSelectedItemsForSection(props);
      // Then
      expect(result).toHaveLength(4);
      expect(result).toMatchObject(mockItems);
    });
  });
});
