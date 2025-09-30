# Testing

## Describe

Use `name-of-file` in describe. Why?

- The file can have more that one function.
- In an infra test maybe we are not calling a function directly; for example, we may use the watcher.

```ts
describe('name-of-file', () => {});
```

## Mocks

By default use `partialSpyOn` in all mocks. Node modules are the only ones that need `vi.mock` and `deepMocked`.

```ts
import * as depModule from 'module';

describe('name-of-file', () => {
  const depMock = partialSpyOn(depModule, 'dep');

  beforeEach(() => {
    depMock.mockReturnValue('first');
  });
});
```

```ts
import { dep } from 'node-module';

vi.mock(import('node-module'));

describe('name-of-file', () => {
  const depMock = deepMocked(dep);

  beforeEach(() => {
    depMock.mockReturnValue('first');
  });
});
```

## Expect

We use only `toHaveLength`, `toBe` or `toMatchObject`. To check the calls of a depMock we use `calls`. Why? `calls` is going to return an array with all calls of a depMock so we can check in the same line the number of calls and the content of them.

```ts
import * as depModule from 'module';

describe('name-of-file', () => {
  const depMock = partialSpyOn(depModule, 'dep');

  it('should do x when y', () => {
    // When
    const res = fn();
    // Then
    expect(res).toHaveLength();
    expect(res).toBe();
    expect(res).toMatchObject();
    calls(depMock).toHaveLength();
    calls(depMock).toMatchObject();
  });
});
```

## Structure

```ts
import * as dep1Module from 'module';
import * as dep2Module from 'module';

describe('name-of-file', () => {
  const dep1Mock = partialSpyOn(dep1Module, 'dep');
  const dep2Mock = partialSpyOn(dep2Module, 'dep');

  let props: Parameters<typeof fn>[0];

  beforeEach(() => {
    dep1Mock.mockReturnValue('first');
    dep2Mock.mockReturnValue('first');

    props = mockProps<typeof fn>({ prop: 'first' });
  });

  it('should do x when y', () => {
    // Given
    dep1Mock.mockReturnValue('second');
    props.prop = 'second';
    // When
    const res = fn(props);
    // Then
    expect(res).toMatchObject({ prop: 'result' });
    calls(dep1Mock).toMatchObject([{ prop: 'input' }]);
  });
});
```
