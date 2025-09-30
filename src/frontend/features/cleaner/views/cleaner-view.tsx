import { useMemo, useState } from 'react';

import { ExtendedCleanerReport } from '@/backend/features/cleaner/types/cleaner.types';
import { LocalContextProps } from '@/frontend/frontend.types';

import { SectionConfig } from '../cleaner.types';
import { SectionsList } from '../components/sections-list';
import { CleanerViewModelHook } from '../use-cleaner-view-model';

type CleanerViewProps = {
  report: ExtendedCleanerReport;
  diskSpace: number;
  sectionConfig: SectionConfig;
  useTranslationContext: () => LocalContextProps;
} & CleanerViewModelHook;

export function CleanerView({
  report,
  viewModel,
  // diskSpace,
  sectionConfig,
  useTranslationContext,
  toggleSection,
  // toggleItemSelection,
  selectAllSections,
  deselectAllSections,
  // getSectionSelectionStats,
  // getTotalSelectedSize,
  getGlobalSelectionStats,
}: CleanerViewProps) {
  const [sectionDetailMenu, setSectionDetailMenu] = useState<string | null>(null); // const totalSize = useMemo(() => {
  //   return Object.values(report).reduce((sum, section) => sum + section.totalSizeInBytes, 0);
  // }, [report]);
  // const selectedSize = useMemo(() => {
  //   return getTotalSelectedSize(report);
  // }, [getTotalSelectedSize, report]);

  const toggleSectionExpansion = (sectionKey: string) => {
    setSectionDetailMenu((prev) => (prev === sectionKey ? null : sectionKey));
  };

  const globalStats = useMemo(() => {
    return getGlobalSelectionStats(report);
  }, [getGlobalSelectionStats, report]);

  const selectAll = () => {
    if (globalStats.isAllSelected) {
      deselectAllSections();
    } else {
      selectAllSections();
    }
  }; // const segmentDetails = useMemo(() => {
  //   return calculateChartSegments({ viewModel, report, totalSize, getSectionSelectionStats, sectionConfig });
  // }, [viewModel, report, totalSize, getSectionSelectionStats]);

  return (
    <div className="relative flex h-full overflow-hidden rounded-lg border border-gray-10 bg-surface shadow-sm dark:bg-gray-5">
      {/* Main View */}
      <div className="flex h-full w-full">
        {/* Left Panel */}
        <SectionsList
          report={report}
          viewModel={viewModel}
          isAllSelected={globalStats.isAllSelected}
          isPartiallySelected={globalStats.isPartiallySelected}
          sectionConfig={sectionConfig}
          useTranslationContext={useTranslationContext}
          onSelectAll={selectAll}
          onToggleSection={toggleSection}
          onToggleSectionExpansion={toggleSectionExpansion}
        />
        {/* Right Panel */}
        {/* <CleanupSizeIndicator selectedSize={selectedSize} totalSize={diskSpace} segmentDetails={segmentDetails} /> */}
      </div>
      {/* Section Detail Menu */}
      {/* {sectionDetailMenu && (
        <SectionDetailMenu
          sectionName={sectionDetailMenu}
          report={report}
          viewModel={viewModel}
          onClose={() => setSectionDetailMenu(null)}
          onToggleSection={toggleSection}
          onToggleItem={toggleItemSelection}
        />
      )} */}
    </div>
  );
}
