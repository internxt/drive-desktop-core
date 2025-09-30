import {
  CleanerSection,
  CleanerSectionKey,
  CleanerSectionViewModel,
  CleanerViewModel,
} from '@/backend/features/cleaner/types/cleaner.types';

export function formatFileSize({ bytes }: { bytes: number }): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function createInitialViewModel<T extends Record<string, CleanerSection>>({
  cleanerSectionKeys,
}: {
  cleanerSectionKeys: CleanerSectionKey<T>[];
}) {
  const viewModel: CleanerViewModel = {};

  cleanerSectionKeys.forEach((sectionKey) => {
    viewModel[sectionKey as string] = {
      selectedAll: true,
      exceptions: [],
    };
  });

  return viewModel;
}

export function isItemSelected({ viewModel, itemPath }: { viewModel: CleanerSectionViewModel; itemPath: string }) {
  const isException = viewModel.exceptions.includes(itemPath);
  return viewModel.selectedAll ? !isException : isException;
}

export function toggleItem({ viewModel, itemPath }: { viewModel: CleanerSectionViewModel; itemPath: string }) {
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

export function toggleSelectAll({ viewModel }: { viewModel: CleanerSectionViewModel }) {
  return {
    selectedAll: !viewModel.selectedAll,
    exceptions: [],
  };
}

export function getSelectedItems({ viewModel, allItems }: { viewModel: CleanerSectionViewModel; allItems: Array<{ fullPath: string }> }) {
  if (viewModel.selectedAll) {
    return allItems.map((item) => item.fullPath).filter((path) => !viewModel.exceptions.includes(path));
  } else {
    return viewModel.exceptions.filter((path) => allItems.some((item) => item.fullPath === path));
  }
}

export function getSectionStats({ viewModel, allItems }: { viewModel: CleanerSectionViewModel; allItems: Array<{ fullPath: string }> }) {
  const selectedItems = getSelectedItems({ viewModel, allItems });
  const selectedCount = selectedItems.length;
  const totalCount = allItems.length;

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

type SectionConfig = Record<string, { name: string; color: string }>;

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
