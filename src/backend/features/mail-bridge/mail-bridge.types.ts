import type { ChildProcess } from 'node:child_process';
import type { Server, Socket } from 'node:net';

import type { MailBridgeConnectionSettings, MailBridgeSyncProgress } from './constants';

export type MailBridgeStatus =
  | { status: 'stopped' | 'starting'; error: undefined }
  | { status: 'running'; error: undefined; connection: MailBridgeConnectionSettings; lastChecked?: number }
  | { status: 'error'; error: string };

export type MailBridgeRuntime = {
  child: ChildProcess;
  server: Server;
  socket: Socket;
  connection: MailBridgeConnectionSettings;
};

export type MailBridgeResources = Partial<Pick<MailBridgeRuntime, 'child' | 'server' | 'socket'>>;
export type { MailBridgeConnectionSettings, MailBridgeSyncProgress };
