import { Result } from '@/common/result';

import { generateSyncRequest } from './generate-sync-request';

describe('generate-sync-request', () => {
  it('adds the EXISTS status to an initial epoch request', () => {
    const result = generateSyncRequest({
      isInitial: true,
      cursor: null,
      updatedAt: '1970-01-01T00:00:00.000Z',
      limit: 1000,
    });

    expect(result).toStrictEqual(Result.ok({ updatedAt: '1970-01-01T00:00:00.000Z', limit: 1000, status: 'EXISTS' }));
  });

  it('does not add a status to an initial checkpoint request', () => {
    const result = generateSyncRequest({
      isInitial: true,
      cursor: null,
      updatedAt: '2026-09-22T10:00:00.000Z',
      limit: 1000,
    });

    expect(result).toStrictEqual(Result.ok({ updatedAt: '2026-09-22T10:00:00.000Z', limit: 1000, status: undefined }));
  });

  it('adds status EXISTS to cursor requests when from is not passed', () => {
    const result = generateSyncRequest({
      isInitial: false,
      cursor: 'cursor-1',
      updatedAt: '1970-01-01T00:00:00.000Z',
      limit: 1000,
    });

    expect(result).toStrictEqual(Result.ok({ cursor: 'cursor-1', limit: 1000, status: 'EXISTS' }));
  });

  it('does not add status EXISTS to cursor requests when from is passed', () => {
    const result = generateSyncRequest({
      isInitial: false,
      cursor: 'cursor-1',
      updatedAt: '2026-09-22T10:00:00.000Z',
      limit: 1000,
    });

    expect(result).toStrictEqual(Result.ok({ cursor: 'cursor-1', limit: 1000, status: undefined }));
  });
});
