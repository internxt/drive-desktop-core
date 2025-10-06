import { CleanerSection, CleanerSectionKey, CleanerViewModel } from '@/backend/features/cleaner/types/cleaner.types';

type Props<T extends Record<string, CleanerSection>> = {
  cleanerSectionKeys: CleanerSectionKey<T>[];
  selectedAll?: boolean;
};

export function createInitialViewModel<T extends Record<string, CleanerSection>>({ cleanerSectionKeys, selectedAll = true }: Props<T>) {
  const viewModel: CleanerViewModel = {};

  for (const sectionKey of cleanerSectionKeys) {
    viewModel[sectionKey as string] = {
      selectedAll,
      exceptions: [],
    };
  }

  return viewModel;
}
