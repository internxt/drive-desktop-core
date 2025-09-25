import { CleanerContext } from '../../types/cleaner.types';

type Props = { ctx: CleanerContext; fileName: string };

export function logFileFilter({ ctx, fileName }: Props): boolean {
  const lowerName = fileName.toLowerCase();

  const includeSafeExtensions = ctx.logFiles.safeExtensions.some((ext) => lowerName.endsWith(ext));
  /**
   * v0.1.1 Esteban Galvis
   * Remove also files that match the pattern of rotated logs
   * e.g. app.log.1, app.log.2.gz, app.log.3.bz2, etc.
   */
  const checkRotatedLog = /\.log(\.\d+)?(\.(gz|bz2|xz|zip))?$/.test(lowerName);

  return includeSafeExtensions && checkRotatedLog;
}
