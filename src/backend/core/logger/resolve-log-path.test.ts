import { join } from 'node:path';

import { resolveLogPath } from './resolve-log-path';

describe('resolve-log-path', () => {
  let props: Parameters<typeof resolveLogPath>[0];

  beforeEach(() => {
    props = { logsPath: 'logs', message: { data: ["{ header: '  - b - sync', msg: 'Message' }"], level: 'debug' } };
  });

  it('should return drive.log for untagged debug messages', () => {
    // When
    const path = resolveLogPath(props);
    // Then
    expect(path).toBe(join('logs', 'drive.log'));
  });

  it('should return drive-important.log for info messages', () => {
    // Given
    props.message = { data: ["{ header: 'E - b - sync', msg: 'Message' }"], level: 'info' };
    // When
    const path = resolveLogPath(props);
    // Then
    expect(path).toBe(join('logs', 'drive-important.log'));
  });

  it('should return mail-bridge.log for mail bridge messages of any level', () => {
    // Given
    props.message = { data: ["{ header: 'E - b - mail', msg: 'Message' }"], level: 'info' };
    // When
    const path = resolveLogPath(props);
    // Then
    expect(path).toBe(join('logs', 'mail-bridge.log'));
  });

  it('should return recovery-sync.log for recovery sync debug messages', () => {
    // Given
    props.message = { data: ["{ header: '  - b - reco', msg: 'Message' }"], level: 'debug' };
    // When
    const path = resolveLogPath(props);
    // Then
    expect(path).toBe(join('logs', 'recovery-sync.log'));
  });

  it('should keep recovery sync errors written with the info level in drive-important.log', () => {
    // Given
    props.message = { data: ["{ header: 'E - b - reco', msg: 'Message' }"], level: 'info' };
    // When
    const path = resolveLogPath(props);
    // Then
    expect(path).toBe(join('logs', 'drive-important.log'));
  });

  it('should return drive.log when there is no message', () => {
    // Given
    props.message = undefined;
    // When
    const path = resolveLogPath(props);
    // Then
    expect(path).toBe(join('logs', 'drive.log'));
  });
});
