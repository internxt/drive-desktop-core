import { throwWrapper } from './throw-wrapper';

describe('throwWrapper', () => {
  it('should return data when function succeeds', async () => {
    const mockSuccessFunction = vi.fn().mockResolvedValue({
      data: 'success result',
      error: undefined,
    });

    const wrappedFunction = throwWrapper(mockSuccessFunction);
    const result = await wrappedFunction('arg1', 'arg2');

    expect(result).toBe('success result');
  });

  it('should throw error when function fails', async () => {
    const mockFailureFunction = vi.fn().mockResolvedValue({
      data: undefined,
      error: new Error('Test error message'),
    });

    const wrappedFunction = throwWrapper(mockFailureFunction);
    const result = wrappedFunction('arg1', 'arg2');

    await expect(result).rejects.toThrow('Test error message');
  });

  it('should handle function with no arguments', async () => {
    const mockFunction = vi.fn().mockResolvedValue({
      data: 42,
      error: undefined,
    });

    const wrappedFunction = throwWrapper(mockFunction);
    const result = await wrappedFunction();

    expect(result).toBe(42);
  });

  it('should handle function with multiple arguments', async () => {
    const mockFunction = vi.fn().mockResolvedValue({
      data: { id: 1, name: 'test' },
      error: undefined,
    });

    const wrappedFunction = throwWrapper(mockFunction);
    const result = await wrappedFunction(1, 'test', true, { key: 'value' });

    expect(result).toStrictEqual({ id: 1, name: 'test' });
  });
});
