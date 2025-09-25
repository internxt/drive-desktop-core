import path from 'path';

import { CleanerContext } from '../../types/cleaner.types';

type Props = {
  ctx: CleanerContext;
  fileName: string;
};

export function appCacheFileFilter({ ctx, fileName }: Props): boolean {
  const ext = path.extname(fileName).toLowerCase();
  const lowerName = fileName.toLowerCase();

  const excludeCriticalExtensions = ctx.appCache.criticalExtensions.includes(ext);
  const excludeCriticalKeywords = ctx.appCache.criticalKeywords.some((keyword) => lowerName.includes(keyword));

  return !(excludeCriticalExtensions || excludeCriticalKeywords);
}
