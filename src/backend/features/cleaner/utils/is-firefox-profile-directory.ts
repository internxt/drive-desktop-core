import { stat } from 'fs/promises';
import path from 'path';

export async function isFirefoxProfileDirectory(entry: string, parentPath: string) {
  const fullPath = path.join(parentPath, entry);

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
