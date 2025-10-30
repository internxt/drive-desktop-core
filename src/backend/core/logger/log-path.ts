import { homedir } from 'node:os';

import { createAbsolutePath } from '@/backend/infra/file-system/file-system.types';

const HOME_DIR = createAbsolutePath(homedir());
const HOME_DIR_LENGTH = HOME_DIR.length;
const INTERNXT_PATTERN = /InternxtDrive - [\w-]+/g;

type Props = { path: string };

export function logPath({ path }: Props) {
  if (path.startsWith(HOME_DIR)) {
    path = '~' + path.slice(HOME_DIR_LENGTH);
  }

  if (path.includes('InternxtDrive')) {
    path = path.replace(INTERNXT_PATTERN, '~');
  }

  return path;
}
