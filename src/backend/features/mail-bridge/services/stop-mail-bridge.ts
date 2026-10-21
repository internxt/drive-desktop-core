import { Result } from '../../../../common/result';
import type { MailBridgeResources } from '../mail-bridge.types';
import { closeControlServer } from './communication.service';

/**
 * Destroys the control socket, closes the server, and terminates the bridge process.
 * Still attempts process termination when closing the server fails.
 *
 * @returns Success when the server closes, or its cleanup error.
 */
export async function stopMailBridgeResources({ child, server, socket }: MailBridgeResources): Promise<Result<undefined, Error>> {
  if (socket) {
    socket.destroy();
  }
  const closed = await closeControlServer({ server });
  if (child && !child.killed) {
    child.kill();
  }
  return closed.error ? Result.err(closed.error) : Result.ok(undefined);
}
