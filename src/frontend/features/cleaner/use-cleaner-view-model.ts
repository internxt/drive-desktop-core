import { useCallback, useState } from 'react';

import { CleanerSectionKey, CleanerViewModel, ExtendedCleanerReport } from '@/backend/features/cleaner/types/cleaner.types';

import { calculateSelectedSize } from './service/calculate-selected-size';
import { createInitialViewModel } from './service/create-initial-view-model';
import { getSectionStats } from './service/get-section-stats';
import { getSelectedItems } from './service/get-selected-items';
import { isItemSelected } from './service/is-item-selected';
import { toggleItem } from './service/toggle-item';
import { toggleSelectAll } from './service/toggle-select-all';

export function useCleanerViewModel(sectionKeys: CleanerSectionKey[]) {
  const keys = sectionKeys;
  const [viewModel, setViewModel] = useState<CleanerViewModel>(createInitialViewModel({ cleanerSectionKeys: keys }));

  const toggleSection = useCallback((sectionKey: string) => {
    setViewModel((prev) => ({
      ...prev,
      [sectionKey]: toggleSelectAll({ viewModel: prev[sectionKey]! }),
    }));
  }, []);

  const toggleItemSelection = useCallback((sectionKey: string, itemPath: string) => {
    setViewModel((prev) => ({
      ...prev,
      [sectionKey]: toggleItem({ viewModel: prev[sectionKey]!, itemPath }),
    }));
  }, []);

  const selectAllSections = useCallback(() => {
    setViewModel(createInitialViewModel({ cleanerSectionKeys: keys }));
  }, []);

  const deselectAllSections = useCallback(() => {
    setViewModel(createInitialViewModel({ cleanerSectionKeys: keys, selectedAll: false }));
  }, []);

  const isItemSelectedInSection = useCallback(
    (sectionKey: string, itemPath: string) => {
      return isItemSelected({ viewModel: viewModel[sectionKey]!, itemPath });
    },
    [viewModel],
  );

  const getSelectedItemsForSection = useCallback(
    (sectionKey: string, report: ExtendedCleanerReport) => {
      const section = report[sectionKey as keyof ExtendedCleanerReport];
      return section ? getSelectedItems({ viewModel: viewModel[sectionKey]!, allItems: section.items }) : [];
    },
    [viewModel],
  );

  const getSectionSelectionStats = useCallback(
    (sectionKey: string, report: ExtendedCleanerReport) => {
      const section = report[sectionKey as keyof ExtendedCleanerReport];
      return section
        ? getSectionStats({ viewModel: viewModel[sectionKey]!, allItems: section.items })
        : {
            selectedCount: 0,
            totalCount: 0,
            isAllSelected: false,
            isPartiallySelected: false,
            isNoneSelected: true,
          };
    },
    [viewModel],
  );

  const getTotalSelectedSize = useCallback(
    (report: ExtendedCleanerReport) => {
      return calculateSelectedSize({ viewModel, report });
    },
    [viewModel],
  );

  const getGlobalSelectionStats = useCallback(
    (report: ExtendedCleanerReport) => {
      const allSectionStats = Object.keys(viewModel).map((sectionKey) => getSectionSelectionStats(sectionKey, report));

      // Only consider non-empty sections for global selection logic
      const nonEmptySectionStats = allSectionStats.filter((stats) => stats.totalCount > 0);

      // If all sections are empty, treat as none selected
      if (nonEmptySectionStats.length === 0) {
        return {
          isAllSelected: false,
          isPartiallySelected: false,
          isNoneSelected: true,
        };
      }

      const allSelected = nonEmptySectionStats.every((stats) => stats.isAllSelected);
      const noneSelected = nonEmptySectionStats.every((stats) => stats.isNoneSelected);
      const partiallySelected = !allSelected && !noneSelected;

      return {
        isAllSelected: allSelected,
        isPartiallySelected: partiallySelected,
        isNoneSelected: noneSelected,
      };
    },
    [viewModel, getSectionSelectionStats],
  );

  return {
    viewModel,
    toggleSection,
    toggleItemSelection,
    selectAllSections,
    deselectAllSections,
    isItemSelectedInSection,
    getSelectedItemsForSection,
    getSectionSelectionStats,
    getTotalSelectedSize,
    getGlobalSelectionStats,
  };
}
export type CleanerViewModelHook = ReturnType<typeof useCleanerViewModel>;
