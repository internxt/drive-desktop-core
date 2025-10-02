import { CleanerSection, CleanerSectionKey, CleanerViewModel, ExtendedCleanerReport } from '@/backend/features/cleaner/types/cleaner.types';

export function createInitialViewModel<T extends Record<string, CleanerSection>>({
  cleanerSectionKeys,
  selectedAll = true,
}: {
  cleanerSectionKeys: CleanerSectionKey<ExtendedCleanerReport<T>>[];
  selectedAll?: boolean;
}) {
  const viewModel = {} as CleanerViewModel;

  for (const sectionKey of cleanerSectionKeys) {
    viewModel[sectionKey as CleanerSectionKey] = {
      selectedAll,
      exceptions: [],
    };
  }

  return viewModel;
}
