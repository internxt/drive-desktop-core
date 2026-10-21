import type { ChildProcess } from 'node:child_process';

export function captureMailBridgeStartupStderr(child: ChildProcess): () => string | undefined {
  let output = '';
  child.stderr?.on('data', (chunk: Buffer) => {
    output = redactMailBridgeStderr(`${output}${chunk.toString()}`).slice(-2_000);
  });

  return () => output.trim() || undefined;
}

function redactMailBridgeStderr(value: string): string {
  return value
    .replace(/(authorization\s*:\s*bearer\s+)\S+/gi, '$1<REDACTED>')
    .replace(/([?&](?:token|password|key)=)[^&\s]+/gi, '$1<REDACTED>')
    .replace(/((?:token|password|private_key)\s*[:=]\s*)\S+/gi, '$1<REDACTED>');
}
