import path from 'path';

import { CleanerContext } from '../../types/cleaner.types';

export function appCacheFileFilter({ ctx, fileName }: { ctx: CleanerContext; fileName: string }): boolean {
  const ext = path.extname(fileName).toLowerCase();
  if (ctx.appCache.criticalExtensions.includes(ext)) {
    return false;
  }

  const lowerName = fileName.toLowerCase();
  if (ctx.appCache.criticalKeywords.some((keyword) => lowerName.includes(keyword))) {
    return false;
  }

  return true;
}
