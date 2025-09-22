import { promises as fs } from 'fs';

async function getLastAccessTime(filePath: string) {
  const stat = await fs.stat(filePath);
  return new Date(Math.max(stat.atime.getTime(), stat.mtime.getTime()));
}

export async function wasAccessedWithinLastHour({ filePath }: { filePath: string }) {
  try {
    const lastAccessTime = await getLastAccessTime(filePath);
    const hoursSinceAccess = (Date.now() - lastAccessTime.getTime()) / (1000 * 60 * 60);
    return hoursSinceAccess <= 1;
  } catch {
    return true;
  }
}
