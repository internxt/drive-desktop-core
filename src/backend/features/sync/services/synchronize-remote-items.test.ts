import { Result } from '@/common/result';

import { synchronizeRemoteItems } from './synchronize-remote-items';

type Item = { uuid: string };

describe('synchronize-remote-items', () => {
  const from = new Date('2026-09-22T10:00:00.000Z');

  function createProps({ checkpoint }: { checkpoint?: Date } = { checkpoint: from }) {
    return {
      from: checkpoint,
      limit: 1000,
      fetchPage: vi.fn(),
      persistItems: vi.fn(),
    };
  }

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should not add status EXISTS when from is passed', async () => {
    const props = createProps();
    const items: Item[] = [{ uuid: 'file-1' }];
    props.fetchPage.mockResolvedValue(Result.ok({ items, nextCursor: null }));
    props.persistItems.mockResolvedValue(Result.ok(undefined));

    const result = await synchronizeRemoteItems(props);

    expect(props.fetchPage).toHaveBeenCalledWith({ updatedAt: from.toISOString(), limit: 1000, status: undefined });
    expect(props.persistItems).toHaveBeenCalledWith({ items });
    expect(result).toStrictEqual({ data: undefined });
  });

  it('should add status EXISTS when from is not passed', async () => {
    const props = createProps({ checkpoint: undefined });
    props.fetchPage.mockResolvedValue(Result.ok({ items: [], nextCursor: null }));
    props.persistItems.mockResolvedValue(Result.ok(undefined));

    await synchronizeRemoteItems(props);

    expect(props.fetchPage).toHaveBeenCalledWith({ updatedAt: '1970-01-01T00:00:00.000Z', limit: 1000, status: 'EXISTS' });
  });

  it('should add status EXISTS to every page when from is not passed', async () => {
    const props = createProps({ checkpoint: undefined });
    props.fetchPage
      .mockResolvedValueOnce(Result.ok({ items: [{ uuid: 'file-1' }], nextCursor: 'cursor-1' }))
      .mockResolvedValueOnce(Result.ok({ items: [], nextCursor: null }));
    props.persistItems.mockResolvedValue(Result.ok(undefined));

    await synchronizeRemoteItems(props);

    expect(props.fetchPage).toHaveBeenNthCalledWith(1, {
      updatedAt: '1970-01-01T00:00:00.000Z',
      limit: 1000,
      status: 'EXISTS',
    });
    expect(props.fetchPage).toHaveBeenNthCalledWith(2, { cursor: 'cursor-1', limit: 1000, status: 'EXISTS' });
  });

  it('uses the next cursor without updatedAt for subsequent pages', async () => {
    const props = createProps();
    props.fetchPage
      .mockResolvedValueOnce(Result.ok({ items: [{ uuid: 'file-1' }], nextCursor: 'cursor-1' }))
      .mockResolvedValueOnce(Result.ok({ items: [{ uuid: 'file-2' }], nextCursor: null }));
    props.persistItems.mockResolvedValue(Result.ok(undefined));

    const result = await synchronizeRemoteItems(props);

    expect(props.fetchPage).toHaveBeenNthCalledWith(1, { updatedAt: from.toISOString(), limit: 1000, status: undefined });
    expect(props.fetchPage).toHaveBeenNthCalledWith(2, { cursor: 'cursor-1', limit: 1000, status: undefined });
    expect(props.persistItems).toHaveBeenCalledTimes(2);
    expect(result).toStrictEqual({ data: undefined });
  });

  it('persists a page before requesting its successor', async () => {
    const props = createProps();
    const events: string[] = [];
    props.fetchPage
      .mockImplementationOnce(() => {
        events.push('fetch-first');
        return Promise.resolve(Result.ok({ items: [{ uuid: 'file-1' }], nextCursor: 'cursor-1' }));
      })
      .mockImplementationOnce(() => {
        events.push('fetch-second');
        return Promise.resolve(Result.ok({ items: [], nextCursor: null }));
      });

    props.persistItems.mockImplementation(() => {
      events.push('persist-first');
      return Promise.resolve(Result.ok(undefined));
    });

    await synchronizeRemoteItems(props);

    expect(events).toStrictEqual(['fetch-first', 'persist-first', 'fetch-second', 'persist-first']);
  });

  it('returns a fetch error without persisting or requesting another page', async () => {
    const props = createProps();
    const error = new Error('fetch failed');
    props.fetchPage.mockResolvedValue(Result.err(error));

    const result = await synchronizeRemoteItems(props);

    expect(result).toStrictEqual({ error });
    expect(props.persistItems).not.toHaveBeenCalled();
    expect(props.fetchPage).toHaveBeenCalledTimes(1);
  });

  it('returns a persistence error without requesting another page', async () => {
    const props = createProps();
    const error = new Error('persist failed');
    props.fetchPage.mockResolvedValue(Result.ok({ items: [{ uuid: 'file-1' }], nextCursor: 'cursor-1' }));
    props.persistItems.mockResolvedValue(Result.err(error));

    const result = await synchronizeRemoteItems(props);

    expect(result).toStrictEqual({ error });
    expect(props.fetchPage).toHaveBeenCalledTimes(1);
  });

  it('converts a thrown fetch error into an error result', async () => {
    const props = createProps();
    const error = new Error('fetch threw');
    props.fetchPage.mockRejectedValue(error);

    const result = await synchronizeRemoteItems(props);

    expect(result).toStrictEqual({ error });
    expect(props.persistItems).not.toHaveBeenCalled();
  });

  it('converts a thrown persistence error into an error result', async () => {
    const props = createProps();
    const error = new Error('persistence threw');
    props.fetchPage.mockResolvedValue(Result.ok({ items: [{ uuid: 'file-1' }], nextCursor: null }));
    props.persistItems.mockRejectedValue(error);

    const result = await synchronizeRemoteItems(props);

    expect(result).toStrictEqual({ error });
  });
});
