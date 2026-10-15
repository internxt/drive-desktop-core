/* eslint-disable sonarjs/no-hardcoded-passwords -- Synthetic secrets verify diagnostic redaction. */
import { ChildProcess } from 'node:child_process';
import { PassThrough } from 'node:stream';

import { captureMailBridgeStartupStderr } from './capture-mail-bridge-startup-stderr';

describe('captureMailBridgeStartupStderr', () => {
  it('should return undefined when stderr is unavailable or empty', () => {
    const child = new ChildProcess();
    expect(captureMailBridgeStartupStderr(child)()).toBeUndefined();
  });

  it('should capture startup diagnostics across chunks and trims whitespace', () => {
    const child = new ChildProcess();
    child.stderr = new PassThrough();
    const read = captureMailBridgeStartupStderr(child);
    child.stderr.emit('data', Buffer.from('  Bridge exited: '));
    child.stderr.emit('data', Buffer.from('port already in use\n'));

    expect(read()).toBe('Bridge exited: port already in use');
  });

  it('should redact authentication headers, query credentials, and secret fields', () => {
    const child = new ChildProcess();
    child.stderr = new PassThrough();
    const read = captureMailBridgeStartupStderr(child);
    child.stderr.emit(
      'data',
      Buffer.from('Authorization: Bearer header-secret\n?token=query-secret&key=key-secret\npassword=mail-secret\n'),
    );

    expect(read()).toBe('Authorization: Bearer <REDACTED>\n?token=<REDACTED>\npassword=<REDACTED>');
  });

  it('should retain only the final 2000 characters of diagnostic output', () => {
    const child = new ChildProcess();
    child.stderr = new PassThrough();
    const read = captureMailBridgeStartupStderr(child);
    child.stderr.emit('data', Buffer.from('old output' + 'x'.repeat(2000)));

    expect(read()).toBe('x'.repeat(2000));
  });
});
