import { promises as fs } from 'fs';

type Props = {
  filePath: string;
};

export async function wasAccessedWithinLastHour({ filePath }: Props) {
  try {
    const stat = await fs.stat(filePath);
    const lastAccessTime = new Date(Math.max(stat.atime.getTime(), stat.mtime.getTime()));
    const hoursSinceAccess = (Date.now() - lastAccessTime.getTime()) / (1000 * 60 * 60);
    return hoursSinceAccess <= 1;
  } catch {
    return true;
  }
}
