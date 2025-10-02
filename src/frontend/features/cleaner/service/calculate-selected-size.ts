import { CleanerSection, CleanerSectionKey, CleanerViewModel } from '@/backend/features/cleaner/types/cleaner.types';

function calculateExceptionsSize(section: CleanerSection, exceptionPaths: string[]): number {
  let size = 0;
  for (const exceptionPath of exceptionPaths) {
    const item = section.items.find((item) => item.absolutePath === exceptionPath);
    if (item) {
      size += item.sizeInBytes;
    }
  }
  return size;
}

function calculateSectionSize(section: CleanerSection, sectionViewModel: CleanerViewModel[CleanerSectionKey]): number {
  if (sectionViewModel.selectedAll) {
    const exceptionsSize = calculateExceptionsSize(section, sectionViewModel.exceptions);
    return section.totalSizeInBytes - exceptionsSize;
  }
  return calculateExceptionsSize(section, sectionViewModel.exceptions);
}

export function calculateSelectedSize<T extends Record<string, CleanerSection>>({
  viewModel,
  report,
}: {
  viewModel: CleanerViewModel;
  report: T;
}): number {
  let totalSize = 0;

  for (const [sectionKey, sectionViewModel] of Object.entries(viewModel)) {
    const section = report[sectionKey as keyof T];
    if (section) {
      totalSize += calculateSectionSize(section, sectionViewModel);
    }
  }

  return totalSize;
}
