import { Result } from './result';

describe('Result', () => {
  it('creates compatible data and error results', () => {
    const error = new Error('failed');

    expect(Result.ok('value')).toStrictEqual({ data: 'value' });
    expect(Result.err(error)).toStrictEqual({ error });
  });

  it('recognizes error results', () => {
    expect(Result.isError(Result.ok('value'))).toBe(false);
    expect(Result.isError(Result.err(new Error('failed')))).toBe(true);
  });

  it('folds each result branch', () => {
    const cases = {
      data: (data: string) => `data: ${data}`,
      error: (error: Error) => `error: ${error.message}`,
    };

    expect(Result.fold(Result.ok('value'), cases)).toBe('data: value');
    expect(Result.fold(Result.err(new Error('failed')), cases)).toBe('error: failed');
  });

  it('maps only data results', () => {
    const error = new TypeError('failed');
    const success = Result.map(Result.ok(2), (data) => data * 2);
    const failureInput = Result.err(error);
    const failure: Result<number, TypeError> = Result.map(failureInput, (data) => data * 2);

    expect(success).toStrictEqual({ data: 4 });
    expect(failure).toBe(failureInput);
  });

  it('maps only errors', () => {
    const error = new TypeError('failed');

    expect(Result.mapError(Result.ok('value'), () => new Error('mapped failure'))).toStrictEqual({ data: 'value' });
    expect(Result.mapError(Result.err(error), (cause) => new Error(cause.message))).toStrictEqual({ error: new Error('failed') });
  });

  it('chains data results and preserves failures', () => {
    const error = new TypeError('failed');
    const failureInput = Result.err(error);
    const failure = Result.flatMap(failureInput, (data) => Result.ok(data * 2));

    expect(Result.flatMap(Result.ok(2), (data) => Result.ok(data * 2))).toStrictEqual({ data: 4 });
    expect(failure).toBe(failureInput);
  });

  it('returns a fallback or recovers a failed result', () => {
    const error = new Error('failed');

    expect(Result.getOrElse(Result.ok('value'), () => 'fallback')).toBe('value');
    expect(Result.getOrElse(Result.err(error), () => 'fallback')).toBe('fallback');
    expect(Result.orElse(Result.ok('value'), () => Result.ok('fallback'))).toStrictEqual({ data: 'value' });
    expect(Result.orElse(Result.err(error), () => Result.ok('fallback'))).toStrictEqual({ data: 'fallback' });
  });
});
