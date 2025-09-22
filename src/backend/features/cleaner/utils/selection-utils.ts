import { CleanableItem, CleanerSectionKey, CleanerReport, CleanerSectionViewModel, CleanerViewModel } from '../types/cleaner.types';

export function getSelectedItemsForSection(sectionViewModel: CleanerSectionViewModel, sectionItems: CleanableItem[]) {
  if (sectionViewModel.selectedAll) {
    return sectionItems.filter((item) => !sectionViewModel.exceptions.includes(item.fullPath));
  } else {
    return sectionItems.filter((item) => sectionViewModel.exceptions.includes(item.fullPath));
  }
}

export function getAllItemsToDelete(
  viewModel: CleanerViewModel,
  report: CleanerReport,
  cleanerSectionKeys: CleanerSectionKey[],
) {
  const itemsToDelete: CleanableItem[] = [];

  cleanerSectionKeys.forEach((sectionKey) => {
    const section = report[sectionKey];
    const sectionViewModel = viewModel[sectionKey];

    if (section && sectionViewModel) {
      const selectedItems = getSelectedItemsForSection(sectionViewModel, section.items);
      itemsToDelete.push(...selectedItems);
    }
  });

  return itemsToDelete;
}
