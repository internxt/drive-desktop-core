import { vi } from 'vitest';

// We do not want to log anything
vi.mock(import('@/backend/core/logger/logger'));
