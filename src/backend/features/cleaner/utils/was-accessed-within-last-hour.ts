import { Stats } from 'fs';

type Props = {
  fileStats: Stats;
};

export function wasAccessedWithinLastHour({ fileStats }: Props) {
  const lastAccessTime = new Date(Math.max(fileStats.atime.getTime(), fileStats.mtime.getTime()));
  const hoursSinceAccess = (Date.now() - lastAccessTime.getTime()) / (1000 * 60 * 60);
  return hoursSinceAccess <= 1;
}
