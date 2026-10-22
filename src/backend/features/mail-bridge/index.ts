// Shared contracts
export { mailBridgeReleaseTag, startupTimeoutMs } from './constants';
export type {
  ControlMessage,
  MailAccountKeys,
  MailBridgeClientCredentials,
  MailBridgeConnectionSettings,
  MailBridgeControlCommand,
  MailBridgeReadyMessage,
  MailBridgeSession,
  MailBridgeSyncProgress,
  MailBridgeSessionPreparationErrorCode,
} from './constants';
export type {
  MailBridgeStatus,
  MailBridgeRuntime,
  MailBridgeResources,
  MailBridgePlatform,
  StartMailBridgeProps,
  MailBridgeService,
  MailBridgeCredentialsStore,
  CreateMailBridgeStateDirectoryProps,
  SpawnMailBridgeProps,
  MailBridgeClientConfig,
  CreateMailBridgeSessionProps,
} from './mail-bridge.types';

// Session and credentials
export { mapMailAccountKeys } from './services/session/map-mail-account-keys';
export { MailBridgeSessionPreparationError } from './services/session/mail-bridge-session-preparation.error';
export { createMailClient } from './services/session/mail-client.service';
export { prepareMailBridgeSession, retrieveMailAccountKeys } from './services/session/session.service';
export { generateRandomPassword } from './services/session/credentials/generate-random-password';
export { mapStoredMailBridgeCredentials } from './services/session/credentials/map-stored-mail-bridge-credentials';
export { encryptMailBridgeCredentials } from './services/session/credentials/encrypt-mail-bridge-credentials';
export { decryptMailBridgeCredentials } from './services/session/credentials/decrypt-mail-bridge-credentials';
export { retrieveMailBridgeCredentials } from './services/session/credentials/retrieve-mail-bridge-credentials';
export { storeCredentials } from './services/session/credentials/store-credentials';
export { getOrCreateMailBridgeCredentials } from './services/session/credentials/get-or-create-mail-bridge-credentials';
export { getMailBridgeEmail } from './services/session/get-mail-bridge-email.service';
export { createMailBridgeSession } from './services/session/create-mail-bridge-session';

// Lifecycle
export { isMailBridgeStopped } from './services/lifecycle/is-mail-bridge-stopped';
export { createMailBridgeService } from './services/lifecycle/mail-bridge.service';

// Startup
export { createStartupTimeout } from './services/startup/create-startup-timeout';
export { createBridgeExitError } from './services/startup/create-bridge-exit-error';
export { waitForMailBridgeConnection } from './services/startup/wait-for-mail-bridge-connection';
export { waitForMailBridgeReady } from './services/startup/wait-for-mail-bridge-ready';
export { waitForMailBridgeExit } from './services/startup/wait-for-mail-bridge-exit';
export { captureMailBridgeStartupStderr } from './services/startup/capture-mail-bridge-startup-stderr';
export { startMailBridge } from './services/startup/start-mail-bridge';

// Process
export { getMailBridgeEnvironment } from './services/process/get-mail-bridge-environment.service';
export { stopMailBridgeResources } from './services/process/stop-mail-bridge';
export { createMailBridgeStateDirectory } from './services/process/create-mail-bridge-state-directory';
export { spawnMailBridge } from './services/process/spawn-mail-bridge';

// Communication
export {
  closeControlServer,
  createConnectionSettings,
  createControlFrame,
  createControlServer,
  listenToControlMessages,
  readControlMessage,
  sendControlMessage,
  waitForControlConnection,
  waitForReadyMessage,
} from './services/communication/communication.service';
export { sendMailBridgeSessionUpdate } from './services/communication/send-mail-bridge-session-update';
export { mapControlMessage } from './services/communication/map-control-message';
export { extractPortFromMailBridgeMessage } from './services/communication/extract-port-from-mail-bridge-message';
export { isMailBridgeSyncMessage } from './services/communication/is-mail-bridge-sync-message';
export { createUnexpectedControlMessageError } from './services/communication/create-unexpected-control-message-error';
export { listenForMailBridgeControlMessages } from './services/communication/mail-bridge-control-messages.service';
