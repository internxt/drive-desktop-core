import { stat } from 'node:fs/promises';
import { join } from 'node:path/posix';

type Props = {
  entry: string;
  parentPath: string;
};

export async function isFirefoxProfileDirectory({ entry, parentPath }: Props) {
  const fullPath = join(parentPath, entry);

  try {
    const entryStat = await stat(fullPath);
    if (!entryStat.isDirectory()) return false;

    if (!parentPath.toLowerCase().includes('profiles')) return false;

    const profileRegex = /^[a-z0-9\-]+\.default(-[a-z]+)?$/i;
    return profileRegex.test(entry);
  } catch {
    return false;
  }
}
