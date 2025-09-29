import {
  CleanerSection,
  CleanerSectionKey,
  CleanerSectionViewModel,
  CleanerViewModel,
} from '@/backend/features/cleaner/types/cleaner.types';

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function createInitialViewModel<T extends Record<string, CleanerSection>>({
  cleanerSectionKeys,
  selectedAll = true,
}: {
  cleanerSectionKeys: CleanerSectionKey<T>[];
  selectedAll?: boolean;
}) {
  const viewModel: CleanerViewModel = {};

  cleanerSectionKeys.forEach((sectionKey) => {
    viewModel[sectionKey as string] = {
      selectedAll,
      exceptions: [],
    };
  });

  return viewModel;
}

export function isItemSelected(viewModel: CleanerSectionViewModel, itemPath: string) {
  const isException = viewModel.exceptions.includes(itemPath);
  return viewModel.selectedAll ? !isException : isException;
}

export function toggleItem(viewModel: CleanerSectionViewModel, itemPath: string) {
  const exceptions = [...viewModel.exceptions];
  const exceptionIndex = exceptions.indexOf(itemPath);

  if (exceptionIndex >= 0) {
    exceptions.splice(exceptionIndex, 1);
  } else {
    exceptions.push(itemPath);
  }

  return {
    ...viewModel,
    exceptions,
  };
}

export function toggleSelectAll(viewModel: CleanerSectionViewModel) {
  return {
    selectedAll: !viewModel.selectedAll,
    exceptions: [],
  };
}

export function getSelectedItems(viewModel: CleanerSectionViewModel, allItems: Array<{ fullPath: string }>) {
  if (viewModel.selectedAll) {
    return allItems.map((item) => item.fullPath).filter((path) => !viewModel.exceptions.includes(path));
  } else {
    return viewModel.exceptions.filter((path) => allItems.some((item) => item.fullPath === path));
  }
}

export function getSectionStats(viewModel: CleanerSectionViewModel, allItems: Array<{ fullPath: string }>) {
  const selectedItems = getSelectedItems(viewModel, allItems);
  const selectedCount = selectedItems.length;
  const totalCount = allItems.length;

  // For empty sections, treat as having no meaningful selection state
  if (totalCount === 0) {
    return {
      selectedCount: 0,
      totalCount: 0,
      isAllSelected: false,
      isPartiallySelected: false,
      isNoneSelected: true,
    };
  }

  return {
    selectedCount,
    totalCount,
    isAllSelected: selectedCount === totalCount,
    isPartiallySelected: selectedCount > 0 && selectedCount < totalCount,
    isNoneSelected: selectedCount === 0,
  };
}

export function calculateSelectedSize<T extends Record<string, CleanerSection>>(viewModel: CleanerViewModel, report: T): number {
  let totalSize = 0;

  Object.entries(viewModel).forEach(([sectionKey, sectionViewModel]) => {
    const section = report[sectionKey as keyof T];
    if (section) {
      if (sectionViewModel.selectedAll) {
        // All selected except exceptions - use total minus exceptions
        totalSize += section.totalSizeInBytes;
        sectionViewModel.exceptions.forEach((exceptionPath) => {
          const item = section.items.find((item) => item.fullPath === exceptionPath);
          if (item) {
            totalSize -= item.sizeInBytes;
          }
        });
      } else {
        // Only exceptions selected - add only exception sizes
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

type SectionConfig = Record<string, { name: string; color: string }>;

/**
 * Calculates visual segments for the circular progress chart in the CleanupSizeIndicator.
 * Each segment represents a cleaner section (appCache, logFiles, etc.) with its color,
 * percentage of the total, and selected size.
 *
 * @param props.viewModel - The current ViewModel state with selections
 * @param props.report - The cleaner report with section data
 * @param props.totalSize - Total size across all sections (for percentage calculation)
 * @param props.getSectionSelectionStats - Function to get selection stats for a section
 * @param props.sectionConfig - Configuration object with section names and colors
 * @returns Array of visual segments for chart rendering, containing color, percentage, and size
 *
 *
 */
export function calculateChartSegments<T extends Record<string, CleanerSection>>(props: {
  viewModel: CleanerViewModel;
  report: T;
  totalSize: number;
  getSectionSelectionStats: (sectionKey: string, report: T) => ReturnType<typeof getSectionStats>;
  sectionConfig: SectionConfig;
}): Array<{ color: string; percentage: number; size: number }> {
  const { viewModel, report, totalSize, getSectionSelectionStats, sectionConfig } = props;
  const segments: Array<{ color: string; percentage: number; size: number }> = [];

  Object.entries(report).forEach(([sectionKey, section]) => {
    const sectionStats = getSectionSelectionStats(sectionKey, report);
    const sectionViewModel = viewModel[sectionKey];

    if (sectionViewModel && sectionStats.selectedCount > 0) {
      let sectionSelectedSize = 0;

      if (sectionViewModel.selectedAll) {
        // All selected except exceptions -> calculate total minus exceptions
        sectionSelectedSize = section.totalSizeInBytes;
        sectionViewModel.exceptions.forEach((exceptionPath) => {
          const item = section.items.find((item) => item.fullPath === exceptionPath);
          if (item) {
            sectionSelectedSize -= item.sizeInBytes;
          }
        });
      } else {
        // Only exceptions selected -> calculate only exception sizes
        sectionViewModel.exceptions.forEach((exceptionPath) => {
          const item = section.items.find((item) => item.fullPath === exceptionPath);
          if (item) {
            sectionSelectedSize += item.sizeInBytes;
          }
        });
      }

      // Only add segments with actual selected size
      if (sectionSelectedSize > 0) {
        const config = sectionConfig[sectionKey];
        segments.push({
          color: config?.color || '#6B7280', // fallback color for unknown sections
          percentage: totalSize > 0 ? (sectionSelectedSize / totalSize) * 100 : 0,
          size: sectionSelectedSize,
        });
      }
    }
  });

  return segments;
}
