import { Result } from '@/common/result';

import { synchronizeRemoteItems } from './synchronize-remote-items';

type Item = { uuid: string };

describe('synchronize-remote-items', () => {
  const updatedAt = '2026-09-22T10:00:00.000Z';

  function createProps() {
    return {
      updatedAt,
      limit: 1000,
      fetchPage: vi.fn(),
      persistItems: vi.fn(),
    };
  }

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('requests the first page using updatedAt and persists it', async () => {
    const props = createProps();
    const items: Item[] = [{ uuid: 'file-1' }];
    props.fetchPage.mockResolvedValue(Result.ok({ items, nextCursor: null }));
    props.persistItems.mockResolvedValue(Result.ok(undefined));

    const result = await synchronizeRemoteItems(props);

    expect(props.fetchPage).toHaveBeenCalledWith({ updatedAt, limit: 1000 });
    expect(props.persistItems).toHaveBeenCalledWith({ items });
    expect(result).toStrictEqual({ data: undefined });
  });

  it('uses the next cursor without updatedAt for subsequent pages', async () => {
    const props = createProps();
    props.fetchPage
      .mockResolvedValueOnce(Result.ok({ items: [{ uuid: 'file-1' }], nextCursor: 'cursor-1' }))
      .mockResolvedValueOnce(Result.ok({ items: [{ uuid: 'file-2' }], nextCursor: null }));
    props.persistItems.mockResolvedValue(Result.ok(undefined));

    const result = await synchronizeRemoteItems(props);

    expect(props.fetchPage).toHaveBeenNthCalledWith(1, { updatedAt, limit: 1000 });
    expect(props.fetchPage).toHaveBeenNthCalledWith(2, { cursor: 'cursor-1', limit: 1000 });
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
