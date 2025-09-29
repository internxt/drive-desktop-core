import { promises as fs } from 'node:fs';

import { isInternxtRelated } from '../utils/is-file-internxt-related';

type Props = {
  baseDir: string;
  customDirectoryFilter?: ({ directoryName }: { directoryName: string }) => boolean;
};

export async function getFilteredDirectories({ baseDir, customDirectoryFilter }: Props) {
  const dirents = await fs.readdir(baseDir, { withFileTypes: true });
  return dirents.filter((dirent) => {
    const isFiltered = customDirectoryFilter && customDirectoryFilter({ directoryName: dirent.name });
    return dirent.isDirectory() && !isInternxtRelated({ name: dirent.name }) && !isFiltered;
  });
}
