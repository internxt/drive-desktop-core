import { AbsolutePath } from '@/backend';
import { CleanerSectionViewModel } from '@/backend/features/cleaner/types/cleaner.types';

export function getSelectedItems({
  viewModel,
  allItems,
}: {
  viewModel: CleanerSectionViewModel;
  allItems: Array<{ absolutePath: AbsolutePath }>;
}) {
  if (viewModel.selectedAll) {
    return allItems.map((item) => item.absolutePath).filter((path) => !viewModel.exceptions.includes(path));
  } else {
    return viewModel.exceptions.filter((path) => allItems.some((item) => item.absolutePath === path));
  }
}
