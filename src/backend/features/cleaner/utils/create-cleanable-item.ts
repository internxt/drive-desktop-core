import { Stats } from 'node:fs';
import { basename } from 'node:path/posix';

import { CleanableItem } from '../types/cleaner.types';

export function createCleanableItem({ fullPath, stat }: { fullPath: string; stat: Stats }) {
  return {
    fullPath,
    fileName: basename(fullPath),
    sizeInBytes: stat.size,
  } as CleanableItem;
}
