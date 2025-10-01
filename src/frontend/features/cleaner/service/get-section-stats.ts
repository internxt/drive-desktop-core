import { CleanerSectionViewModel } from '@/backend/features/cleaner/types/cleaner.types';

import { getSelectedItems } from './get-selected-items';

export function getSectionStats({ viewModel, allItems }: { viewModel: CleanerSectionViewModel; allItems: Array<{ fullPath: string }> }) {
  const selectedItems = getSelectedItems({ viewModel, allItems });
  const selectedCount = selectedItems.length;
  const totalCount = allItems.length;

  if (totalCount === 0) {
    return {
      selectedCount: 0,
      totalCount: 0,
      isAllSelected: false,
      isPartiallySelected: false,
      isNoneSelected: true,
    };
  }

  return {
    selectedCount,
    totalCount,
    isAllSelected: selectedCount === totalCount,
    isPartiallySelected: selectedCount > 0 && selectedCount < totalCount,
    isNoneSelected: selectedCount === 0,
  };
}
