import { promises as fs } from 'fs';
import path from 'path';

export async function isFirefoxProfileDirectory(entry: string, parentPath: string) {
  const fullPath = path.join(parentPath, entry);
  try {
    const stat = await fs.stat(fullPath);
    if (!stat.isDirectory()) return false;

    const REQUIRED_FILES = ['prefs.js', 'key4.db', 'places.sqlite'];

    const files = await fs.readdir(fullPath);
    return REQUIRED_FILES.some((file) => files.includes(file));
  } catch {
    return false;
  }
}
