import { CleanableItem, CleanerSectionKey, CleanerReport, CleanerSectionViewModel, CleanerViewModel } from '../types/cleaner.types';

type SelectedItemsForSectionProps = {
  sectionViewModel: CleanerSectionViewModel;
  sectionItems: CleanableItem[];
};
export function getSelectedItemsForSection({ sectionViewModel, sectionItems }: SelectedItemsForSectionProps) {
  if (sectionViewModel.selectedAll) {
    return sectionItems.filter((item) => !sectionViewModel.exceptions.includes(item.fullPath));
  } else {
    return sectionItems.filter((item) => sectionViewModel.exceptions.includes(item.fullPath));
  }
}

type AllItemsToDeleteProps = {
  viewModel: CleanerViewModel;
  report: CleanerReport;
  cleanerSectionKeys: CleanerSectionKey[];
};

export function getAllItemsToDelete({ viewModel, report, cleanerSectionKeys }: AllItemsToDeleteProps) {
  const itemsToDelete: CleanableItem[] = [];

  cleanerSectionKeys.forEach((sectionKey) => {
    const section = report[sectionKey];
    const sectionViewModel = viewModel[sectionKey];

    if (section && sectionViewModel) {
      const selectedItems = getSelectedItemsForSection({ sectionViewModel, sectionItems: section.items });
      itemsToDelete.push(...selectedItems);
    }
  });

  return itemsToDelete;
}
