import { promises as fs } from 'fs';
import path from 'path';

import { CleanableItem } from '../types/cleaner.types';

export async function createCleanableItem({ filePath }: { filePath: string }) {
  const stat = await fs.stat(filePath);
  return {
    fullPath: filePath,
    fileName: path.basename(filePath),
    sizeInBytes: stat.size,
  } as CleanableItem;
}
