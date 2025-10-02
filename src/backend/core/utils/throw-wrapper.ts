type Result<T> = { data: T; error: undefined } | { data: undefined; error: Error };

export function throwWrapper<Args extends unknown[], T>(fn: (...args: Args) => Promise<Result<T>>) {
  return async (...args: Args): Promise<T> => {
    const { data, error } = await fn(...args);
    if (error) throw error;
    return data;
  };
}
