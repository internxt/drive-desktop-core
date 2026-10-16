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
} from './services/communication.service';
export { sendMailBridgeSessionUpdate } from './services/send-mail-bridge-session-update';
export { mapControlMessage } from './mappers/map-control-message';
export { mapMailAccountKeys } from './mappers/map-mail-account-keys';
export { MailBridgeSessionPreparationError } from './errors/mail-bridge-session-preparation.error';
export { createMailClient } from './services/mail-client.service';
export { prepareMailBridgeSession, retrieveMailAccountKeys } from './services/session.service';
export { extractPortFromMailBridgeMessage } from './utils/extract-port-from-mail-bridge-message';
export { mailBridgeReleaseTag, startupTimeoutMs } from './constants';
export { isMailBridgeSyncMessage } from './utils/is-mail-bridge-sync-message';
export { createUnexpectedControlMessageError } from './utils/create-unexpected-control-message-error';
export { createStartupTimeout } from './utils/create-startup-timeout';
export { createBridgeExitError } from './utils/create-bridge-exit-error';
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

export type { MailBridgeStatus, MailBridgeRuntime, MailBridgeResources } from './mail-bridge.types';
export { listenForMailBridgeControlMessages } from './services/mail-bridge-control-messages.service';
export { waitForMailBridgeConnection, waitForMailBridgeReady } from './services/mail-bridge-startup.service';
export { getMailBridgeEnvironment } from './services/get-mail-bridge-environment.service';
export { stopMailBridgeResources } from './services/stop-mail-bridge';
export { isMailBridgeStopped } from './utils/is-mail-bridge-stopped';
export { captureMailBridgeStartupStderr } from './services/capture-mail-bridge-startup-stderr';
export { generateRandomPassword } from './utils/generate-random-password';
export { mapStoredMailBridgeCredentials } from './mappers/map-stored-mail-bridge-credentials';
export { encryptMailBridgeCredentials } from './utils/encrypt-mail-bridge-credentials';
export { decryptMailBridgeCredentials } from './utils/decrypt-mail-bridge-credentials';
