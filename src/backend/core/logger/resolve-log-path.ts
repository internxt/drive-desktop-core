import { LogMessage } from 'electron-log';
import { join } from 'node:path';

type Props = {
  logsPath: string;
  message?: Pick<LogMessage, 'data' | 'level'>;
};

function hasTag(message: Props['message'], tag: string): boolean {
  return message?.data?.some((data) => typeof data === 'string' && data.includes(` - ${tag}'`)) ?? false;
}

/**
 * v2.7.2 Alexis Mora
 * Recovery sync keeps its whole history in its own file so a run can be followed chronologically in one place.
 * Errors are also written with the info level, which stays in drive-important.log like any other error,
 * so each recovery line is written only once in recovery-sync.log.
 */
export function resolveLogPath({ logsPath, message }: Props) {
  if (hasTag(message, 'mail')) {
    return join(logsPath, 'mail-bridge.log');
  }

  if (message?.level === 'info') {
    return join(logsPath, 'drive-important.log');
  }

  if (hasTag(message, 'reco')) {
    return join(logsPath, 'recovery-sync.log');
  }

  return join(logsPath, 'drive.log');
}
