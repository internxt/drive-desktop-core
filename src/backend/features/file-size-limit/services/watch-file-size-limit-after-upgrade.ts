import { logger } from '@/backend/core/logger/logger';
import { Result } from '@/common/result';

import { FILE_SIZE_LIMIT_UPGRADE_POLL_INTERVAL_MS, FILE_SIZE_LIMIT_UPGRADE_WATCH_DURATION_MS } from '../constants';
import { FileSizeLimitAdapter } from '../file-size-limit.types';
import { revalidateFileSizeLimit } from './revalidate-file-size-limit';

type Props = Pick<FileSizeLimitAdapter, 'getStoredLimit' | 'saveLimit' | 'saveLastRevalidatedAt' | 'fetchLimit'>;

type Watch = {
  interval: NodeJS.Timeout;
  deadline: number;
};

let watch: Watch | undefined;

/**
 * v1.5.1 Victor Fernandez
 * After the user clicks to upgrade, the payment may finish after the next upload asks for the limit, so the limit is
 * asked once per minute until it changes or the watch expires.
 */
export function watchFileSizeLimitAfterUpgrade({ getStoredLimit, saveLimit, saveLastRevalidatedAt, fetchLimit }: Props) {
  const deadline = Date.now() + FILE_SIZE_LIMIT_UPGRADE_WATCH_DURATION_MS;

  if (watch) {
    watch.deadline = deadline;
    return;
  }

  const initialLimit = getStoredLimit();
  logger.debug({ tag: 'SYNC-ENGINE', msg: 'Watching user file size limit after upgrade', initialLimit });

  const current: Watch = {
    deadline,
    interval: setInterval(
      () => void checkLimit({ current, initialLimit, saveLimit, saveLastRevalidatedAt, fetchLimit }),
      FILE_SIZE_LIMIT_UPGRADE_POLL_INTERVAL_MS,
    ),
  };

  watch = current;
}

export function stopWatchingFileSizeLimit() {
  if (watch) stopWatch({ current: watch });
}

async function checkLimit({
  current,
  initialLimit,
  saveLimit,
  saveLastRevalidatedAt,
  fetchLimit,
}: Omit<Props, 'getStoredLimit'> & { current: Watch; initialLimit: number }) {
  if (Date.now() > current.deadline) {
    stopWatch({ current });
    return;
  }

  const res = await revalidateFileSizeLimit({ saveLimit, saveLastRevalidatedAt, fetchLimit });

  if (!Result.isError(res) && res.data !== initialLimit) {
    stopWatch({ current });
  }
}

function stopWatch({ current }: { current: Watch }) {
  clearInterval(current.interval);
  if (watch === current) watch = undefined;
  logger.debug({ tag: 'SYNC-ENGINE', msg: 'Stopped watching user file size limit after upgrade' });
}
