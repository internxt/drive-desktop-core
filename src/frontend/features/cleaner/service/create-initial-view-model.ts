import { CleanerSection, CleanerSectionKey, CleanerViewModel } from '@/backend/features/cleaner/types/cleaner.types';

export function createInitialViewModel<T extends Record<string, CleanerSection>>({
  cleanerSectionKeys,
  selectedAll = true,
}: {
  cleanerSectionKeys: CleanerSectionKey<T>[];
  selectedAll?: boolean;
}) {
  const viewModel: CleanerViewModel = {};

  cleanerSectionKeys.forEach((sectionKey) => {
    viewModel[sectionKey as string] = {
      selectedAll,
      exceptions: [],
    };
  });

  return viewModel;
}
