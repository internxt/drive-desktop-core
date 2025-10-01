import { CleanerSection, CleanerSectionKey, CleanerViewModel } from '@/backend/features/cleaner/types/cleaner.types';

export function createInitialViewModel<T extends Record<string, CleanerSection>>({
  cleanerSectionKeys,
}: {
  cleanerSectionKeys: CleanerSectionKey<T>[];
}) {
  const viewModel: CleanerViewModel = {};

  for (const sectionKey of cleanerSectionKeys) {
    viewModel[sectionKey as string] = {
      selectedAll: true,
      exceptions: [],
    };
  }

  return viewModel;
}
