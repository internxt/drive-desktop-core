import { Stats } from 'node:fs';
import { basename } from 'node:path/posix';

import { CleanableItem } from '../types/cleaner.types';

export function createCleanableItem({ absolutePath, stat }: { absolutePath: string; stat: Stats }) {
  return {
    fullPath: absolutePath,
    fileName: basename(absolutePath),
    sizeInBytes: stat.size,
  } as CleanableItem;
}
