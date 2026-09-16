import { createServer, type Server, type Socket } from 'node:net';
import { maxControlFrameSize, type MailBridgeConnectionSettings, type MailBridgeReadyMessage, type MailBridgeSession } from '../constants';
import { mapControlMessage } from '../mappers/map-control-message';
import { extractPortFromMailBridgeMessage } from '../utils/extract-port-from-mail-bridge-message';
import { extractHostnameFromMailBridgeMessage } from '../utils/extract-hostname-from-mail-bridge-message';
import { hasValidListenerSettings } from '../utils/has-valid-listener-settings';

/**
 * Converts the Bridge ready response into non-secret settings for a local mail client.
 */
export function createConnectionSettings({
  ready,
  session,
}: {
  ready: MailBridgeReadyMessage;
  session: MailBridgeSession;
}): { data: MailBridgeConnectionSettings; error: undefined } | { data: undefined; error: Error } {
  const listenerSettings = {
    imapHostname: extractHostnameFromMailBridgeMessage({ address: ready.imap_address }),
    smtpHostname: extractHostnameFromMailBridgeMessage({ address: ready.smtp_address }),
    imapPort: extractPortFromMailBridgeMessage({ address: ready.imap_address }),
    smtpPort: extractPortFromMailBridgeMessage({ address: ready.smtp_address }),
  };
  if (!hasValidListenerSettings(listenerSettings)) {
    return { data: undefined, error: new Error('Mail Bridge returned invalid listener addresses') };
  }
  return {
    data: {
      hostname: listenerSettings.imapHostname,
      imapPort: listenerSettings.imapPort,
      smtpPort: listenerSettings.smtpPort,
      username: session.mail_client.username,
      password: session.mail_client.password,
      imapSecurity: ready.starttls ? 'STARTTLS' : 'None',
      smtpSecurity: 'None',
    },
    error: undefined,
  };
}



/**
 * Encodes a control message using the Bridge length-prefixed JSON protocol.
 */
export function createControlFrame(message: object) {
  try {
    const payload = Buffer.from(JSON.stringify(message));
    if (!payload.length || payload.length > maxControlFrameSize) return { data: undefined, error: new Error('Mail Bridge control message is invalid') };
    const frame = Buffer.allocUnsafe(4 + payload.length);
    frame.writeUInt32BE(payload.length, 0);
    payload.copy(frame, 4);
    return { data: frame, error: undefined };
  } catch (error) {
    return { data: undefined, error: error instanceof Error ? error : new Error('Could not encode Mail Bridge control data') };
  }
}

/**
 * Creates and starts the private server used for the parent-to-Bridge control channel.
 */
export async function createControlServer({ endpoint }: { endpoint: string }): Promise<
  { data: Server; error: undefined } | { data: undefined; error: Error }
> {
  const server = createServer();
  return await new Promise((resolveServer) => {
    server.once('error', (error) => resolveServer({ data: undefined, error }));
    try {
      server.listen(endpoint, () => {
        server.removeAllListeners('error');
        resolveServer({ data: server, error: undefined });
      });
    } catch (error) {
      resolveServer({ data: undefined, error: error instanceof Error ? error : new Error('Could not create the Mail Bridge control server') });
    }
  });
}

/**
 * Frames and writes one control message to the connected Bridge socket.
 */
export async function sendControlMessage({ socket, message }: { socket: Socket; message: object }) {
  const frame = createControlFrame(message);
  if (frame.error) return frame;
  return await new Promise<{ data: undefined; error: undefined } | { data: undefined; error: Error }>((resolveWrite) => {
    let finished = false;
    
    function finish(error: Error | undefined): void {
      if (finished) return;
      finished = true;
      socket.removeListener('error', onError);
      resolveWrite(error ? { data: undefined, error } : { data: undefined, error: undefined });
    }

    function onError(error: Error): void {
      finish(error);
    }

    socket.once('error', onError);
    try {
      socket.write(frame.data, (error) => finish(error ?? undefined));
    } catch (error) {
      finish(error instanceof Error ? error : new Error('Could not send Mail Bridge control data'));
    }
  });
}

/**
 * Resolves with the first Bridge socket that connects to the private control server.
 */
export function waitForControlConnection(
  { server }: { server: Server }
): Promise<{ data: Socket; error: undefined } | { data: undefined; error: Error }> {
  return new Promise((resolveConnection) => {
    const onError = (error: Error) => resolveConnection({ data: undefined, error });
    server.once('error', onError);
    server.once('connection', (socket) => {
      server.removeListener('error', onError);
      socket.on('error', () => undefined);
      resolveConnection({ data: socket, error: undefined });
    });
  });
}

/**
 * Stops accepting connections and closes the private control server.
 */
export async function closeControlServer({ server }: { server: Server | undefined }) {
  if (!server) return { data: undefined, error: undefined };
  try {
    await new Promise<void>((resolveClose, rejectClose) => server.close((error) => (error ? rejectClose(error) : resolveClose())));
    return { data: undefined, error: undefined };
  } catch (error) {
    return { data: undefined, error: error instanceof Error ? error : new Error('Could not close the Mail Bridge control server') };
  }
}

/**
 * Reads one complete control frame, preserving any following bytes for the next read.
 */
export function readControlMessage(buffer: Buffer) {
  const frame = readControlFrame(buffer);
  if (!frame.data) return frame;
  try {
    const mappedMessage = mapControlMessage(JSON.parse(frame.data.payload.toString()));
    if (mappedMessage.error) return mappedMessage;
    return { data: { message: mappedMessage.data, remaining: frame.data.remaining }, error: undefined };
  } catch (error) {
    return { data: undefined, error: error instanceof Error ? error : new Error('Mail Bridge sent unreadable startup data') };
  }
}

/**
 * Waits for the Bridge startup response while buffering partial control frames.
 */
export function waitForReadyMessage(
  { socket }: { socket: Socket }
): Promise<{ data: MailBridgeReadyMessage; error: undefined } | { data: undefined; error: Error }> {
  if (socket.destroyed) return Promise.resolve({ data: undefined, error: new Error('Mail Bridge closed before becoming ready') });

  return new Promise((resolveReady) => {
    let pending: Buffer<ArrayBufferLike> = Buffer.alloc(0);

    function finish(result: { data: MailBridgeReadyMessage; error: undefined } | { data: undefined; error: Error }): void {
      socket.removeListener('data', onData);
      socket.removeListener('error', onError);
      socket.removeListener('close', onClose);
      resolveReady(result);
    }

    function onError(error: Error): void {
      finish({ data: undefined, error });
    }

    function onClose(): void {
      finish({ data: undefined, error: new Error('Mail Bridge closed before becoming ready') });
    }

    function onData(chunk: Buffer): void {
      pending = Buffer.concat([pending, chunk]);
      const decoded = readControlMessage(pending);
      if (!decoded.data) {
        if (decoded.error) finish({ data: undefined, error: decoded.error });
        return;
      }
      pending = decoded.data.remaining;
      finish(
        decoded.data.message.type === 'ready'
          ? { data: decoded.data.message.ready, error: undefined }
          : { data: undefined, error: new Error(`Mail Bridge could not start: ${decoded.data.message.error.code}`) },
      );
    }
    socket.on('data', onData);
    socket.once('error', onError);
    socket.once('close', onClose);
  });
}

function readControlFrame(buffer: Buffer) {
  if (buffer.length < 4) return { data: undefined, error: undefined };
  const size = buffer.readUInt32BE(0);
  if (!size || size > maxControlFrameSize) return { data: undefined, error: new Error('Mail Bridge sent an invalid control frame') };
  if (buffer.length < size + 4) return { data: undefined, error: undefined };
  return { data: { payload: buffer.subarray(4, size + 4), remaining: buffer.subarray(size + 4) }, error: undefined };
}
