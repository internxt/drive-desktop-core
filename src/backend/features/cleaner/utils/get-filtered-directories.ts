import { promises as fs } from 'fs';

import { isInternxtRelated } from '../utils/is-file-internxt-related';

type Props = {
  baseDir: string;
  customDirectoryFilter?: (directoryName: string) => boolean;
};

export async function getFilteredDirectories({ baseDir, customDirectoryFilter }: Props) {
  const dirents = await fs.readdir(baseDir, { withFileTypes: true });
  return dirents.filter(
    (dirent) =>
      dirent.isDirectory() && !isInternxtRelated({ name: dirent.name }) && (!customDirectoryFilter || !customDirectoryFilter(dirent.name)),
  );
}
