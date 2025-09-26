import { join } from 'path';
import { cwd } from 'process';

import { logger } from '@/backend/core/logger/logger';

export const TEST_FILES = join(cwd(), 'test-files');
export const loggerMock = vi.mocked(logger);
