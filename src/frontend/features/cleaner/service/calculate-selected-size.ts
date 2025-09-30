import { CleanerSection, CleanerViewModel } from '@/backend/features/cleaner/types/cleaner.types';

export function calculateSelectedSize<T extends Record<string, CleanerSection>>({
  viewModel,
  report,
}: {
  viewModel: CleanerViewModel;
  report: T;
}): number {
  let totalSize = 0;

  Object.entries(viewModel).forEach(([sectionKey, sectionViewModel]) => {
    const section = report[sectionKey as keyof T];
    if (section) {
      if (sectionViewModel.selectedAll) {
        totalSize += section.totalSizeInBytes;
        sectionViewModel.exceptions.forEach((exceptionPath) => {
          const item = section.items.find((item) => item.fullPath === exceptionPath);
          if (item) {
            totalSize -= item.sizeInBytes;
          }
        });
      } else {
        sectionViewModel.exceptions.forEach((exceptionPath) => {
          const item = section.items.find((item) => item.fullPath === exceptionPath);
          if (item) {
            totalSize += item.sizeInBytes;
          }
        });
      }
    }
  });

  return totalSize;
}
