import { Socket } from 'node:net';

import type { ControlMessage } from '../../constants';
import { createControlFrame } from './communication.service';
import { listenForMailBridgeControlMessages } from './mail-bridge-control-messages.service';

describe('listenForMailBridgeControlMessages', () => {
  let socket: Socket;
  let stop: () => void;
  const onControlMessage = vi.fn();
  const onUnexpectedExit = vi.fn();

  function listen(initialBuffer: Buffer = Buffer.alloc(0)) {
    stop = listenForMailBridgeControlMessages({ socket, initialBuffer, onControlMessage, onUnexpectedExit });
  }

  function frame(message: ControlMessage): Buffer {
    const encoded = createControlFrame(message);
    if (encoded.error) throw encoded.error;
    return encoded.data;
  }

  beforeEach(() => {
    socket = new Socket();
    listen();
  });

  afterEach(() => {
    stop();
    socket.destroy();
  });

  const syncMessages: ControlMessage[] = [
    { type: 'sync_started', started: { total: 2 } },
    { type: 'sync_progress', progress: { downloaded: 1, total: 2, percent: 50 } },
    { type: 'sync_finished', finished: { downloaded: 2, total: 2 } },
    { type: 'sync_finished', finished: { downloaded: 1, total: 2, code: 'sync-failed' } },
  ];

  it.each(syncMessages)('should forward $type messages with their source socket', (message) => {
    socket.emit('data', frame(message));

    expect(onControlMessage).toHaveBeenCalledExactlyOnceWith({ socket, message });
    expect(onUnexpectedExit).not.toHaveBeenCalled();
  });

  it('should report bridge errors through the unexpected-exit callback', () => {
    socket.emit('data', frame({ type: 'error', error: { code: 'session-expired' } }));

    expect(onUnexpectedExit).toHaveBeenCalledExactlyOnceWith({ socket, error: new Error('Mail Bridge stopped: session-expired') });
    expect(onControlMessage).not.toHaveBeenCalled();
  });

  it('should treat a second ready message as an unexpected lifecycle failure', () => {
    socket.emit(
      'data',
      frame({ type: 'ready', ready: { imap_address: '127.0.0.1:1143', smtp_address: '127.0.0.1:1025', starttls: false } }),
    );

    expect(onUnexpectedExit).toHaveBeenCalledExactlyOnceWith({
      socket,
      error: new Error('Mail Bridge sent an unexpected control message'),
    });
    expect(onControlMessage).not.toHaveBeenCalled();
  });

  it('should process complete messages buffered during startup', () => {
    stop();
    const message: ControlMessage = { type: 'sync_started', started: { total: 2 } };

    listen(frame(message));

    expect(onControlMessage).toHaveBeenCalledExactlyOnceWith({ socket, message });
    expect(onUnexpectedExit).not.toHaveBeenCalled();
  });

  it('should retain partial startup data until the remaining bytes arrive', () => {
    stop();
    const message: ControlMessage = { type: 'sync_started', started: { total: 2 } };
    const encoded = frame(message);
    listen(encoded.subarray(0, 3));
    expect(onControlMessage).not.toHaveBeenCalled();

    socket.emit('data', encoded.subarray(3));

    expect(onControlMessage).toHaveBeenCalledExactlyOnceWith({ socket, message });
  });

  it('should preserve socket errors and detach control listeners', () => {
    const error = new Error('Control connection lost');

    socket.emit('error', error);

    expect(onUnexpectedExit).toHaveBeenCalledExactlyOnceWith({ socket, error });
    expect(socket.listenerCount('data')).toBe(0);
    expect(socket.listenerCount('close')).toBe(0);
  });

  it('should report socket closure as an unexpected bridge exit', () => {
    socket.emit('close');

    expect(onUnexpectedExit).toHaveBeenCalledExactlyOnceWith({
      socket,
      error: new Error('Mail Bridge control channel closed unexpectedly'),
    });
    expect(socket.listenerCount('data')).toBe(0);
    expect(onControlMessage).not.toHaveBeenCalled();
  });

  it('should stop listening without closing the socket or reporting an exit', () => {
    stop();
    socket.emit('data', frame({ type: 'sync_started', started: { total: 2 } }));
    socket.emit('close');

    expect(socket.destroyed).toBe(false);
    expect(socket.listenerCount('data')).toBe(0);
    expect(socket.listenerCount('error')).toBe(0);
    expect(socket.listenerCount('close')).toBe(0);
    expect(onControlMessage).not.toHaveBeenCalled();
    expect(onUnexpectedExit).not.toHaveBeenCalled();
  });
});
