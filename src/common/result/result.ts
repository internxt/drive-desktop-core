type DataResult<T> = {
  data: T;
  error?: undefined;
};

type ErrorResult<E extends Error> = {
  error: E;
  data?: undefined;
};

/**
 * Represents the outcome of an operation that either produces data or a typed error.
 *
 * use `Result.isError` to narrow it.
 */
export type Result<T, E extends Error = Error> = DataResult<T> | ErrorResult<E>;

export const Result = {
  /** Creates a successful result containing data. */
  ok<T>(data: T): Result<T, never> {
    return { data };
  },

  /** Creates a failed result containing an error. */
  err<E extends Error>(error: E): Result<never, E> {
    return { error };
  },

  /** Narrows a result to its error branch. */
  isError<T, E extends Error>(result: Result<T, E>): result is ErrorResult<E> {
    return result.error !== undefined;
  },

  /** Handles both branches and returns the value produced by the matching handler. */
  fold<T, E extends Error, R>(
    result: Result<T, E>,
    cases: {
      data: (data: T) => R;
      error: (error: E) => R;
    },
  ): R {
    return Result.isError(result) ? cases.error(result.error) : cases.data(result.data);
  },

  /** Transforms successful data while preserving an error unchanged. */
  map<T, E extends Error, R>(result: Result<T, E>, transform: (data: T) => R): Result<R, E> {
    return Result.isError(result) ? result : Result.ok(transform(result.data));
  },

  /** Transforms an error while preserving successful data unchanged. */
  mapError<T, E extends Error, F extends Error>(result: Result<T, E>, transform: (error: E) => F): Result<T, F> {
    return Result.isError(result) ? Result.err(transform(result.error)) : result;
  },

  /**
   * Transforms successful data with an operation that can also fail.
   *
   * The resulting error type includes errors from both operations.
   */
  flatMap<T, E extends Error, R, F extends Error>(result: Result<T, E>, transform: (data: T) => Result<R, F>): Result<R, E | F> {
    return Result.isError(result) ? result : transform(result.data);
  },

  /** Returns successful data, or computes a fallback from an error. This ends a Result pipeline. */
  getOrElse<T, E extends Error>(result: Result<T, E>, fallback: (error: E) => T): T {
    return Result.isError(result) ? fallback(result.error) : result.data;
  },

  /** Recovers from an error with another Result-producing operation. */
  orElse<T, E extends Error, F extends Error>(result: Result<T, E>, recover: (error: E) => Result<T, F>): Result<T, F> {
    return Result.isError(result) ? recover(result.error) : result;
  },
};
