import { CleanableItem, CleanerSectionViewModel } from '../types/cleaner.types';
import { getSelectedItemsForSection } from './get-selected-items-for-section';

describe('getSelectedItemsForSection', () => {
  const mockItems: CleanableItem[] = [
    { fullPath: '/path/to/file1.txt', fileName: 'file1.txt', sizeInBytes: 1024 },
    { fullPath: '/path/to/file2.txt', fileName: 'file2.txt', sizeInBytes: 2048 },
    { fullPath: '/path/to/file3.txt', fileName: 'file3.txt', sizeInBytes: 512 },
    { fullPath: '/path/to/file4.txt', fileName: 'file4.txt', sizeInBytes: 4096 },
  ];

  describe('when selectedAll is true', () => {
    it('should return all items when there are no exceptions', () => {
      // Given
      const sectionViewModel: CleanerSectionViewModel = {
        selectedAll: true,
        exceptions: [],
      };
      // When
      const result = getSelectedItemsForSection({
        sectionViewModel,
        sectionItems: mockItems,
      });
      // Then
      expect(result).toHaveLength(4);
      expect(result).toMatchObject(mockItems);
    });

    it('should exclude items that are in exceptions', () => {
      // Given
      const sectionViewModel: CleanerSectionViewModel = {
        selectedAll: true,
        exceptions: ['/path/to/file2.txt', '/path/to/file4.txt'],
      };
      // When
      const result = getSelectedItemsForSection({
        sectionViewModel,
        sectionItems: mockItems,
      });
      // Then
      expect(result).toHaveLength(2);
      expect(result).toMatchObject([mockItems[0], mockItems[2]]);
    });
  });

  describe('when selectedAll is false', () => {
    it('should return empty array when there are no exceptions', () => {
      // Given
      const sectionViewModel: CleanerSectionViewModel = {
        selectedAll: false,
        exceptions: [],
      };
      // When
      const result = getSelectedItemsForSection({
        sectionViewModel,
        sectionItems: mockItems,
      });
      // Then
      expect(result).toHaveLength(0);
      expect(result).toMatchObject([]);
    });

    it('should return only items that are in exceptions', () => {
      // Given
      const sectionViewModel: CleanerSectionViewModel = {
        selectedAll: false,
        exceptions: ['/path/to/file1.txt', '/path/to/file3.txt'],
      };
      // When
      const result = getSelectedItemsForSection({
        sectionViewModel,
        sectionItems: mockItems,
      });
      // Then
      expect(result).toHaveLength(2);
      expect(result).toMatchObject([mockItems[0], mockItems[2]]);
    });

    it('should return all items when all paths are in exceptions', () => {
      // Given
      const sectionViewModel: CleanerSectionViewModel = {
        selectedAll: false,
        exceptions: ['/path/to/file1.txt', '/path/to/file2.txt', '/path/to/file3.txt', '/path/to/file4.txt'],
      };
      // When
      const result = getSelectedItemsForSection({
        sectionViewModel,
        sectionItems: mockItems,
      });
      // Then
      expect(result).toHaveLength(4);
      expect(result).toMatchObject(mockItems);
    });
  });
});
