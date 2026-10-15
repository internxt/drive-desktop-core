import { createBridgeExitError } from './create-bridge-exit-error';

describe('createBridgeExitError', () => {
  it('should include available startup stderr in the exit error', () => {
    const error = createBridgeExitError({ message: 'Bridge exited before connecting', getStartupError: () => 'address already in use' });

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Bridge exited before connecting: address already in use');
  });

  it.each([undefined, ''])('should keep the exit message when startup stderr is %s', (stderr) => {
    const error = createBridgeExitError({ message: 'Bridge exited before connecting', getStartupError: () => stderr });

    expect(error.message).toBe('Bridge exited before connecting');
  });
});
