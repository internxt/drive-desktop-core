import type { ChildProcess } from 'node:child_process';
import type { Server, Socket } from 'node:net';

import type { Result } from '../../../common/result';
import type { ControlMessage, MailBridgeConnectionSettings, MailBridgeSession, MailBridgeSyncProgress } from './constants';

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

/** Operations whose implementation depends on the host desktop platform. */
export type MailBridgePlatform = {
  /** Creates a private Unix socket path or Windows named-pipe endpoint. */
  createControlEndpoint: (id: string) => string | Promise<string>;
  /**
   * Releases endpoint storage after the server closes.
   * Linux uses this to remove the private Unix socket directory.
   * In Windows we can leave this property out because named pipes require no directory cleanup.
   */
  removeControlEndpoint?: (endpoint: string) => Promise<void>;
  createMailBridgeStateDirectory: (accountId: string) => Promise<Result<string, Error>>;
  spawnMailBridge: (input: { endpoint: string; stateDirectory: string }) => Result<ChildProcess, Error>;
};

/** Session and callbacks owned by the bridge lifecycle service. */
export type StartMailBridgeProps = {
  session: MailBridgeSession;
  onControlMessage: (input: { socket: Socket; message: ControlMessage }) => void;
  onUnexpectedExit: (input: { socket: Socket; error: Error }) => void;
  onResourcesChange: (resources: MailBridgeResources) => void;
  signal: AbortSignal;
};

/** Lifecycle operations and subscriptions belonging to one bridge service instance. */
export type MailBridgeService = {
  startMailBridge: (session: MailBridgeSession) => Promise<Result<MailBridgeConnectionSettings, Error>>;
  stopMailBridge: () => Promise<Result<undefined, Error>>;
  resyncMailBridge: () => Promise<Result<undefined, Error>>;
  updateMailBridgeAccessToken: (input: { token: string }) => Promise<Result<undefined, Error>>;
  getMailBridgeStatus: () => MailBridgeStatus;
  getMailBridgeSyncProgress: () => MailBridgeSyncProgress | undefined;
  subscribeToMailBridgeStatus: (listener: (status: MailBridgeStatus) => void) => () => void;
  subscribeToMailBridgeSyncProgress: (listener: (progress: MailBridgeSyncProgress | undefined) => void) => () => void;
};

/** Account-scoped storage supplied by desktop. only encrypted values cross this boundary. */
export type MailBridgeCredentialsStore = {
  read: () => Result<string | undefined, Error>;
  /** Persists the encrypted payload, throwing when the write fails. */
  write: (encryptedCredentials: string) => void;
};

/** Host paths used to create the bridge's per-account state directory. */
export type CreateMailBridgeStateDirectoryProps = {
  baseDirectory: string;
  accountId: string;
};

/** Resolved executable, environment, and control paths supplied by the desktop app. */
export type SpawnMailBridgeProps = {
  executablePath: string;
  workingDirectory?: string;
  endpoint: string;
  stateDirectory: string;
  environment: NodeJS.ProcessEnv;
};

/** Authenticated Mail client settings supplied by the host application. */
export type MailBridgeClientConfig = {
  gatewayUrl: string;
  clientName: string;
  clientVersion: string;
  desktopHeader: string;
  token: string;
};

/** Account and authentication snapshot used to prepare a secret bridge session. */
export type CreateMailBridgeSessionProps = {
  accountId: string;
  email: string;
  mnemonic: string;
  clientConfig: MailBridgeClientConfig;
  credentialsStore: MailBridgeCredentialsStore;
};
