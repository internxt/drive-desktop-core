import { CleanerSection, CleanerViewModel } from '@/backend/features/cleaner/types/cleaner.types';

import { calculateSectionSize } from './calculate-section-size';

type Props<T> = { viewModel: CleanerViewModel; report: T };

export function calculateSelectedSize<T extends Record<string, CleanerSection>>({ viewModel, report }: Props<T>) {
  let totalSize = 0;

  for (const [sectionKey, sectionViewModel] of Object.entries(viewModel)) {
    const section = report[sectionKey as keyof T];
    if (section) {
      totalSize += calculateSectionSize({ section, sectionViewModel });
    }
  }

  return totalSize;
}
