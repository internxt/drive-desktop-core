import path from 'path';

import { CleanerContext } from '../../types/cleaner.types';

type Props = {
  ctx: CleanerContext;
  fileName: string;
};

export function appCacheFileFilter({ ctx, fileName }: Props): boolean {
  const ext = path.extname(fileName).toLowerCase();
  if (ctx.appCache.criticalExtensions.includes(ext)) {
    return false;
  }

  const lowerName = fileName.toLowerCase();
  const excludeCriticalKeywords = ctx.appCache.criticalKeywords.some((keyword) => lowerName.includes(keyword));
  if (excludeCriticalKeywords) {
    return false;
  }

  return true;
}
