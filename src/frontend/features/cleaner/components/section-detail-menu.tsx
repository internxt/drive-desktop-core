import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';

import { CleanerSection, CleanerSectionKey, CleanerViewModel, ExtendedCleanerReport } from '@/backend/features/cleaner/types/cleaner.types';
import { LocalContextProps } from '@/frontend/frontend.types';

import { SectionConfig } from '../cleaner.types';
import { getSectionStats } from '../service/get-section-stats';
import { isItemSelected } from '../service/is-item-selected';
import { SectionDetailHeader } from './section-detail-header';
import { SectionDetailMenuItem } from './section-detail-menu-item';
import { Separator } from './separator';

type Props<T extends Record<string, CleanerSection> = {}> = {
  sectionName: CleanerSectionKey<ExtendedCleanerReport<T>>;
  report: ExtendedCleanerReport<T>;
  viewModel: CleanerViewModel<T>;
  sectionConfig: SectionConfig;
  onClose: () => void;
  onToggleSection: (sectionKey: CleanerSectionKey) => void;
  onToggleItem: (sectionKey: CleanerSectionKey, itemPath: string) => void;
  useTranslationContext: () => LocalContextProps;
};

export function SectionDetailMenu({
  sectionName,
  report,
  viewModel,
  sectionConfig,
  onClose,
  onToggleSection,
  onToggleItem,
  useTranslationContext,
}: Readonly<Props>) {
  if (!sectionName) return <></>;

  const sectionData = report[sectionName];
  const sectionViewModel = viewModel[sectionName];
  if (!sectionViewModel) return <></>;
  const stats = getSectionStats({ viewModel: sectionViewModel, allItems: sectionData.items });

  const isAllSelected = stats.isAllSelected;
  const isPartiallySelected = stats.isPartiallySelected;
  const isEmpty = stats.totalCount === 0;

  const handleSelectAll = () => {
    if (!isEmpty) {
      onToggleSection(sectionName);
    }
  };
  const parentRef = useRef<HTMLDivElement>(null);
  const items = sectionData.items;

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 10,
  });

  return (
    <div
      className={
        'absolute right-0 top-0 z-10 h-full transform border-l border-gray-10 bg-surface shadow-sm transition-transform duration-300 ease-in-out dark:bg-gray-5'
      }
      style={{ width: '75%' }}>
      <SectionDetailHeader
        sectionName={sectionName}
        onClose={onClose}
        isAllSelected={isAllSelected}
        isPartiallySelected={isPartiallySelected}
        isEmpty={isEmpty}
        onSelectAll={handleSelectAll}
        useTranslationContext={useTranslationContext}
        sectionConfig={sectionConfig}
      />
      <Separator classname="mx-2" />
      <div className="flex h-full flex-1 flex-col p-4">
        <div ref={parentRef} className="bg-space flex-1 overflow-auto rounded-lg dark:bg-gray-5" style={{ height: '100%' }}>
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}>
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const item = items[virtualItem.index];
              if (!item) return <></>;
              const isSelected = isItemSelected({ viewModel: sectionViewModel, itemPath: item.absolutePath });

              return (
                <div
                  key={virtualItem.key.toString()}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`,
                  }}>
                  <SectionDetailMenuItem
                    item={item}
                    sectionName={sectionName}
                    showSeparatorOnTop={virtualItem.index > 0}
                    isSelected={isSelected}
                    onToggleItem={onToggleItem}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
