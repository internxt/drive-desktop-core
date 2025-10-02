import { CleanerSectionViewModel } from '@/backend/features/cleaner/types/cleaner.types';
import { AbsolutePath } from '@/backend/infra/file-system/file-system.module';

import { getSelectedItems } from './get-selected-items';

export function getSectionStats({
  viewModel,
  allItems,
}: {
  viewModel: CleanerSectionViewModel;
  allItems: Array<{ absolutePath: AbsolutePath }>;
}) {
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
