import { posix, win32 } from 'node:path';

import { Brand } from '@/backend/core/utils/brand.types';

export type AbsolutePath = Brand<string, 'AbsolutePath'>;
export type RelativePath = Brand<string, 'RelativePath'>;

export function createAbsolutePath(...parts: string[]) {
  let path = posix.join(...parts);
  path = path.replaceAll(win32.sep, posix.sep);
  path = posix.normalize(path);
  return path as AbsolutePath;
}

export function dirname(path: AbsolutePath) {
  return posix.dirname(path) as AbsolutePath;
}
