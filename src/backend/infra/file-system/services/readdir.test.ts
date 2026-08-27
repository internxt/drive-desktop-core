import { randomUUID } from 'node:crypto';
import { chmod, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { cwd } from 'node:process';
import { execSync } from 'node:child_process';

import { TEST_FILES } from '@/tests/vitest/mocks.helper.test';

import { readdir } from './readdir';

describe('readdir', () => {
  it('If folder exists', async () => {
    // When
    const { data } = await readdir({ absolutePath: cwd() });
    // Then
    expect(data).toBeTruthy();
  });

  it('If folder does not exist (ENOENT)', async () => {
    // When
    const { error } = await readdir({ absolutePath: 'non_existing_folder' });
    // Then
    expect(error?.code).toEqual('NON_EXISTS');
  });

  it('If folder access is denied (EPERM)', async () => {
    // Given
    const folder = join(TEST_FILES, randomUUID());
    await mkdir(folder);
     if (process.platform === 'win32') {
      execSync(`icacls "${folder}" /deny "${process.env.USERNAME}":F`);
    } else {
      await chmod(folder, 0o000);
    }
    // When
    try {
      const { error } = await readdir({ absolutePath: folder });
      // Then
      expect(error?.code).toEqual('NO_ACCESS');
    } finally {
      if (process.platform === 'win32') {
        execSync(`icacls "${folder}" /reset`);
      } else {
        await chmod(folder, 0o755);
      }
      await rm(folder, { recursive: true });
    }
  });
});
