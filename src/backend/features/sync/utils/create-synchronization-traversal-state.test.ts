import { createSynchronizationTraversalState } from './create-synchronization-traversal-state';

describe('create-synchronization-traversal-state', () => {
  it('creates an empty traversal state', () => {
    const state = createSynchronizationTraversalState({});

    expect(state).toStrictEqual({ cursor: null, isInitial: true });
  });

  it('creates a cursor state', () => {
    const state = createSynchronizationTraversalState({ cursor: 'cursor-2', isInitial: false });

    expect(state).toStrictEqual({ cursor: 'cursor-2', isInitial: false });
  });
});
