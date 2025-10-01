import { stat } from './services/stat';

export type { AbsolutePath, RelativePath } from './file-system.types';
export const FileSystemModule = {
  stat,
};
