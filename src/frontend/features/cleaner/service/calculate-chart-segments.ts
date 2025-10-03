import { CleanerSection, CleanerViewModel } from '@/backend/features/cleaner/types/cleaner.types';

import { SectionConfig } from '../cleaner.types';
import { calculateSectionSize } from './calculate-section-size';
import { getSectionStats } from './get-section-stats';

type Props<T extends Record<string, CleanerSection>> = {
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
}: Props<T>) {
  const segments: Array<{ color: string; percentage: number; size: number }> = [];

  for (const [sectionKey, section] of Object.entries(report)) {
    const sectionStats = getSectionSelectionStats(sectionKey, report);
    const sectionViewModel = viewModel[sectionKey];

    if (!sectionViewModel || sectionStats.selectedCount === 0) {
      continue;
    }

    const sectionSelectedSize = calculateSectionSize({ section, sectionViewModel });

    if (sectionSelectedSize > 0) {
      const config = sectionConfig[sectionKey];
      segments.push({
        color: config?.color || '#6B7280',
        percentage: totalSize > 0 ? (sectionSelectedSize / totalSize) * 100 : 0,
        size: sectionSelectedSize,
      });
    }
  }

  return segments;
}