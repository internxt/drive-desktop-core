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

function calculateExceptionsSize(section: CleanerSection, exceptionPaths: string[]): number {
  let size = 0;
  for (const exceptionPath of exceptionPaths) {
    const item = section.items.find((item) => item.fullPath === exceptionPath);
    if (item) {
      size += item.sizeInBytes;
    }
  }
  return size;
}

function calculateSectionSelectedSize(section: CleanerSection, sectionViewModel: CleanerViewModel[string]): number {
  if (sectionViewModel.selectedAll) {
    const exceptionsSize = calculateExceptionsSize(section, sectionViewModel.exceptions);
    return section.totalSizeInBytes - exceptionsSize;
  }
  return calculateExceptionsSize(section, sectionViewModel.exceptions);
}

function createSegment(sectionSelectedSize: number, totalSize: number, sectionKey: string, sectionConfig: SectionConfig) {
  const config = sectionConfig[sectionKey];
  return {
    color: config?.color || '#6B7280',
    percentage: totalSize > 0 ? (sectionSelectedSize / totalSize) * 100 : 0,
    size: sectionSelectedSize,
  };
}

export function calculateChartSegments<T extends Record<string, CleanerSection>>({
  viewModel,
  report,
  totalSize,
  getSectionSelectionStats,
  sectionConfig,
}: calculateChartSegmentsProps<T>) {
  const segments: Array<{ color: string; percentage: number; size: number }> = [];

  for (const [sectionKey, section] of Object.entries(report)) {
    const sectionStats = getSectionSelectionStats(sectionKey, report);
    const sectionViewModel = viewModel[sectionKey];

    if (!sectionViewModel || sectionStats.selectedCount === 0) {
      continue;
    }

    const sectionSelectedSize = calculateSectionSelectedSize(section, sectionViewModel);

    if (sectionSelectedSize > 0) {
      segments.push(createSegment(sectionSelectedSize, totalSize, sectionKey, sectionConfig));
    }
  }

  return segments;
}
