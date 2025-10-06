import {
  CleanableItem,
  CleanerSectionKey,
  CleanerSectionViewModel,
  CleanerViewModel,
  CleanerSection,
  ExtendedCleanerReport,
} from '../types/cleaner.types';

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

type AllItemsToDeleteProps<T extends Record<string, CleanerSection> = {}> = {
  viewModel: CleanerViewModel;
  report: ExtendedCleanerReport<T>;
  cleanerSectionKeys: CleanerSectionKey<ExtendedCleanerReport<T>>[];
};

export function getAllItemsToDelete<T extends Record<string, CleanerSection> = {}>({
  viewModel,
  report,
  cleanerSectionKeys,
}: AllItemsToDeleteProps<T>) {
  const itemsToDelete: CleanableItem[] = [];

  for (const sectionKey of cleanerSectionKeys) {
    const section = report[sectionKey];
    const sectionViewModel = viewModel[sectionKey as keyof CleanerViewModel];

    if (sectionViewModel) {
      const selectedItems = getSelectedItemsForSection({ sectionViewModel, sectionItems: section.items });
      itemsToDelete.push(...selectedItems);
    }
  }

  return itemsToDelete;
}
