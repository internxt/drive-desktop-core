import { CleanerSection, CleanerViewModel } from '@/backend/features/cleaner/types/cleaner.types';

import { SectionConfig } from '../cleaner.types';
import { getSectionStats } from './get-section-stats';

type calculateChartSegmentsProps<T extends Record<string, CleanerSection>> = {
  viewModel: CleanerViewModel;
  report: T;
  totalSize: number;
  getSectionSelectionStats: (sectionKey: string, report: T) => ReturnType<typeof getSectionStats>;
  sectionConfig: SectionConfig;
};

export function calculateChartSegments<T extends Record<string, CleanerSection>>({
  viewModel,
  report,
  totalSize,
  getSectionSelectionStats,
  sectionConfig,
}: calculateChartSegmentsProps<T>) {
  const segments: Array<{ color: string; percentage: number; size: number }> = [];

  Object.entries(report).forEach(([sectionKey, section]) => {
    const sectionStats = getSectionSelectionStats(sectionKey, report);
    const sectionViewModel = viewModel[sectionKey];

    if (sectionViewModel && sectionStats.selectedCount > 0) {
      let sectionSelectedSize = 0;

      if (sectionViewModel.selectedAll) {
        sectionSelectedSize = section.totalSizeInBytes;
        sectionViewModel.exceptions.forEach((exceptionPath) => {
          const item = section.items.find((item) => item.fullPath === exceptionPath);
          if (item) {
            sectionSelectedSize -= item.sizeInBytes;
          }
        });
      } else {
        sectionViewModel.exceptions.forEach((exceptionPath) => {
          const item = section.items.find((item) => item.fullPath === exceptionPath);
          if (item) {
            sectionSelectedSize += item.sizeInBytes;
          }
        });
      }

      if (sectionSelectedSize > 0) {
        const config = sectionConfig[sectionKey];
        segments.push({
          color: config?.color || '#6B7280',
          percentage: totalSize > 0 ? (sectionSelectedSize / totalSize) * 100 : 0,
          size: sectionSelectedSize,
        });
      }
    }
  });

  return segments;
}
