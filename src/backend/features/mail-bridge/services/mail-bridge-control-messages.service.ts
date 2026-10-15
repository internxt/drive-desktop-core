import type { Socket } from 'node:net';

import type { ControlMessage } from '../constants';
import { createUnexpectedControlMessageError } from '../utils/create-unexpected-control-message-error';
import { isMailBridgeSyncMessage } from '../utils/is-mail-bridge-sync-message';
import { listenToControlMessages } from './communication.service';

type ListenForMailBridgeControlMessagesProps = {
  socket: Socket;
  initialBuffer: Buffer;
  onControlMessage: (input: { socket: Socket; message: ControlMessage }) => void;
  onUnexpectedExit: (input: { socket: Socket; error: Error }) => void;
};

/**
 * Applies running-bridge lifecycle rules to messages read from the control socket.
 * Forwards synchronization messages to onControlMessage; bridge errors, unexpected
 * message types, socket errors, and socket closure are reported through onUnexpectedExit.
 * Each callback includes the socket so callers can identify the affected runtime.
 *
 * @param props - The control socket, bytes left over from startup, and lifecycle callbacks.
 * @returns A function that removes the control listeners without closing the socket.
 */
export function listenForMailBridgeControlMessages({
  socket,
  initialBuffer,
  onControlMessage,
  onUnexpectedExit,
}: ListenForMailBridgeControlMessagesProps): () => void {
  return listenToControlMessages({
    socket,
    initialBuffer,
    onMessage: (message) => handleControlMessage({ message, socket, onControlMessage, onUnexpectedExit }),
    onError: (error) => onUnexpectedExit({ socket, error }),
    onClose: () => onUnexpectedExit({ socket, error: new Error('Mail Bridge control channel closed unexpectedly') }),
  });
}

/** Routes sync activity to the caller and treats other messages as lifecycle failures. */
function handleControlMessage({
  message,
  socket,
  onControlMessage,
  onUnexpectedExit,
}: {
  message: ControlMessage;
  socket: Socket;
  onControlMessage: (input: { socket: Socket; message: ControlMessage }) => void;
  onUnexpectedExit: (input: { socket: Socket; error: Error }) => void;
}): void {
  if (isMailBridgeSyncMessage(message)) return onControlMessage({ socket, message });
  onUnexpectedExit({ socket, error: createUnexpectedControlMessageError(message) });
}
