import { failStartup } from './fail-startup';

describe('failStartup', () => {
  it('clears runtime state and progress and reports the original error', () => {
    const error = new Error('Bridge could not start');
    const clearRuntimeResources = vi.fn();
    const setSyncProgress = vi.fn();
    const setStatus = vi.fn();

    const result = failStartup({ error, generation: 2, lifecycleGeneration: 2, clearRuntimeResources, setSyncProgress, setStatus });

    expect(result.error).toBe(error);
    expect(clearRuntimeResources).toHaveBeenCalledExactlyOnceWith();
    expect(setSyncProgress).toHaveBeenCalledExactlyOnceWith(undefined);
    expect(setStatus).toHaveBeenCalledExactlyOnceWith({ status: 'error', error: error.message });
    expect(clearRuntimeResources.mock.invocationCallOrder[0]).toBeLessThan(setStatus.mock.invocationCallOrder[0]!);
  });

  it('returns an obsolete startup error without changing the current lifecycle', () => {
    const error = new Error('Previous startup failed');
    const clearRuntimeResources = vi.fn();
    const setSyncProgress = vi.fn();
    const setStatus = vi.fn();

    const result = failStartup({ error, generation: 1, lifecycleGeneration: 2, clearRuntimeResources, setSyncProgress, setStatus });

    expect(result.error).toBe(error);
    expect(clearRuntimeResources).not.toHaveBeenCalled();
    expect(setSyncProgress).not.toHaveBeenCalled();
    expect(setStatus).not.toHaveBeenCalled();
  });
});
