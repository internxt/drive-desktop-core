import { CleanableItem } from '@/backend/features/cleaner/types/cleaner.types';
import { Checkbox } from '@/frontend/components/checkbox';

import { formatFileSize } from '../service/format-file-size';
import { Separator } from './separator';

type Props = {
  item: CleanableItem;
  sectionName: string;
  showSeparatorOnTop: boolean;
  isSelected: boolean;
  onToggleItem: (sectionKey: string, itemPath: string) => void;
};

export function SectionDetailMenuItem({ item, sectionName, showSeparatorOnTop, isSelected, onToggleItem }: Readonly<Props>) {
  return (
    <div key={item.fullPath}>
      {showSeparatorOnTop && <Separator size="small" />}

      <div className="flex cursor-pointer items-center px-2 py-4 transition-colors duration-500">
        <Checkbox
          label={item.fileName}
          className="font-semibold hover:cursor-pointer"
          checked={isSelected}
          onClick={() => onToggleItem(sectionName, item.fullPath)}
        />

        <div className="flex flex-1 items-end justify-end">
          <span className="text-sm text-gray-50">{formatFileSize({ bytes: item.sizeInBytes })}</span>
        </div>
      </div>
    </div>
  );
}
