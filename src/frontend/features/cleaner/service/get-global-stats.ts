import { CleanerReport, CleanerSectionKey, CleanerViewModel } from '@/backend/features/cleaner/types/cleaner.types';

import { getSectionStats } from './get-section-stats';

type Props = {
  viewModel: CleanerViewModel;
  report: CleanerReport;
  sectionKeys: CleanerSectionKey[];
};

export function getGlobalStats({ viewModel, report, sectionKeys }: Props) {
  const allSectionStats = sectionKeys.map((sectionKey) => {
    const section = report[sectionKey];
    if (!section) {
      return {
        selectedCount: 0,
        totalCount: 0,
        selected: 'none',
      };
    }

    return getSectionStats({ viewModel: viewModel[sectionKey], allItems: section.items })
  });

  const nonEmptySectionStats = allSectionStats.filter((stats) => stats.totalCount > 0);

  if (nonEmptySectionStats.length === 0) {
    return {
      isAllSelected: false,
      isPartiallySelected: false,
      isNoneSelected: true,
    };
  }

  const allSelected = nonEmptySectionStats.every((stats) => stats.selected === 'all');
  const noneSelected = nonEmptySectionStats.every((stats) => stats.selected === 'none');
  const partiallySelected = !allSelected && !noneSelected;

  return {
    isAllSelected: allSelected,
    isPartiallySelected: partiallySelected,
    isNoneSelected: noneSelected,
  };
}
