import { Result } from '@/common/result';

export function throwWrapper<Args extends unknown[], T>(fn: (...args: Args) => Promise<Result<NonNullable<T>>>) {
  return async (...args: Args) => {
    const result = await fn(...args);

    if (Result.isError(result)) throw result.error;

    return result.data;
  };
}
