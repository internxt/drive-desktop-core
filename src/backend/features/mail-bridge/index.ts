export {
  closeControlServer,
  createConnectionSettings,
  createControlFrame,
  createControlServer,
  readControlMessage,
  sendControlMessage,
  waitForControlConnection,
  waitForReadyMessage,
} from './services/communication.service';
export { mapControlMessage } from './mappers/map-control-message';
export { extractPortFromMailBridgeMessage } from './utils/extract-port-from-mail-bridge-message';
export type {
  ControlMessage,
  MailBridgeClientCredentials,
  MailBridgeConnectionSettings,
  MailBridgeReadyMessage,
  MailBridgeSession,
} from './constants';
