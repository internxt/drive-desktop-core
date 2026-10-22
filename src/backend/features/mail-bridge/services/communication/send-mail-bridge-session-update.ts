import type { Socket } from 'node:net';

import { sendControlMessage } from './communication.service';

export async function sendMailBridgeSessionUpdate({ socket, token }: { socket: Socket; token: string }) {
  if (!token) return { data: undefined, error: new Error('Mail Bridge access token is required') };
  return await sendControlMessage({
    socket,
    message: { type: 'session_updated', update: { backend_session: { token } } },
  });
}
