import { Stats } from 'fs';
import path from 'path';

import { CleanableItem } from '../types/cleaner.types';

export function createCleanableItem({ filePath, stat }: { filePath: string; stat: Stats }) {
  return {
    fullPath: filePath,
    fileName: path.basename(filePath),
    sizeInBytes: stat.size,
  } as CleanableItem;
}
