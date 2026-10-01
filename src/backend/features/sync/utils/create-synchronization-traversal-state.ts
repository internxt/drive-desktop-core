import type { SynchronizationTraversalState } from '../constants';

type Props = {
  cursor?: string | null;
  isInitial?: boolean;
};

export function createSynchronizationTraversalState({ cursor = null, isInitial = true }: Props = {}): SynchronizationTraversalState {
  return {
    cursor,
    isInitial,
  };
}
