import { CleanerContext } from '../types/cleaner.types';

type Props = {
  ctx: CleanerContext;
  fileName: string;
};

export function isSafeWebBrowserFile({ ctx, fileName }: Props) {
  const lowerName = fileName.toLowerCase();
  const allCriticalFiles = Object.values(ctx.browser.specificCriticalFile).flat();

  return !(
    ctx.browser.criticalExtensions.some((ext) => lowerName.endsWith(ext)) ||
    ctx.browser.criticalFilenames.some((filename) => filename === lowerName) ||
    allCriticalFiles.includes(lowerName)
  );
}
