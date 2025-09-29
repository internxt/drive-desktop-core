import { Stats } from 'node:fs';
import path from 'node:path';

import { CleanableItem } from '../types/cleaner.types';

export function createCleanableItem({ filePath, stat }: { filePath: string; stat: Stats }) {
  return {
    fullPath: filePath,
    fileName: path.basename(filePath),
    sizeInBytes: stat.size,
  } as CleanableItem;
}
