import { Stats } from 'node:fs';
import { basename } from 'node:path/posix';

import { AbsolutePath } from '@/backend/infra/file-system/file-system.types';

import { CleanableItem } from '../types/cleaner.types';

export function createCleanableItem({ absolutePath, stat }: { absolutePath: AbsolutePath; stat: Stats }) {
  return {
    absolutePath,
    fileName: basename(absolutePath),
    sizeInBytes: stat.size,
  } as CleanableItem;
}
