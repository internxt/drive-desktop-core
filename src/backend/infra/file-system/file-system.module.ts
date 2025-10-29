import { throwAsyncWrapper } from '@/backend/core/utils/throw-wrapper';

import { readdir } from './services/readdir';
import { stat } from './services/stat';

export type { AbsolutePath, Path, RelativePath } from './file-system.types';
export { createPath, dirname } from './file-system.types';
export const FileSystemModule = {
  stat,
  statThrow: throwAsyncWrapper(stat),
  readdir,
  readdirThrow: throwAsyncWrapper(readdir),
};
