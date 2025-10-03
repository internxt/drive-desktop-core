import { CleanableItem, CleanerSectionKey } from '@/backend/features/cleaner/types/cleaner.types';
import { Checkbox } from '@/frontend/components/checkbox';

import { formatFileSize } from '../service/format-file-size';
import { Separator } from './separator';

type SectionDetailMenuItemProps = {
  item: CleanableItem;
  sectionName: CleanerSectionKey;
  showSeparatorOnTop: boolean;
  isSelected: boolean;
  onToggleItem: (sectionKey: CleanerSectionKey, itemPath: string) => void;
};

export function SectionDetailMenuItem({
  item,
  sectionName,
  showSeparatorOnTop,
  isSelected,
  onToggleItem,
}: Readonly<SectionDetailMenuItemProps>) {
  return (
    <div key={item.absolutePath}>
      {showSeparatorOnTop && <Separator size="small" />}

      <div className="flex cursor-pointer items-center gap-3 px-2 py-4 transition-colors duration-500">
        <div className="min-w-0 flex-1">
          <Checkbox
            label={item.fileName}
            className="font-semibold hover:cursor-pointer"
            checked={isSelected}
            onClick={() => onToggleItem(sectionName, item.absolutePath)}
          />
        </div>

        <div className="flex shrink-0 items-end">
          <span className="text-sm text-gray-50">{formatFileSize({ bytes: item.sizeInBytes })}</span>
        </div>
      </div>
    </div>
  );
}
