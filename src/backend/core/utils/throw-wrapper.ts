type Result<T> = { data: NonNullable<T>; error: undefined } | { data: undefined; error: Error };

export function throwAsyncWrapper<Args extends unknown[], T>(fn: (...args: Args) => Promise<Result<T>>) {
  return async (...args: Args) => {
    const { data, error } = await fn(...args);
    if (error) throw error;
    return data;
  };
}

export function throwWrapper<Args extends unknown[], T>(fn: (...args: Args) => Result<T>) {
  return (...args: Args) => {
    const { data, error } = fn(...args);
    if (error) throw error;
    return data;
  };
}
