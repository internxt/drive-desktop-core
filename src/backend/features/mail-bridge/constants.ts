export const MAX_ALLOWED_PORT = 65_535;
export const maxControlFrameSize = 1 << 20;
export const mailBridgeReleaseTag = 'v0.0.4';

export type MailBridgeClientCredentials = {
  username: string;
  password: string;
};

export type MailAccountKeys = {
  address: string;
  publicKey: string;
  encryptionPrivateKey: string;
};

export type MailBridgeSessionPreparationErrorCode = 'mail-not-setup' | 'mail-key-fetch-failed' | 'mail-key-unlock-failed';

export type MailBridgeSession = {
  account_id: string;
  addresses: string[];
  backend_session: {
    token: string;
    encryption_private_key: string;
  };
  mail_client: MailBridgeClientCredentials;
};

export type MailBridgeConnectionSettings = {
  hostname: string;
  imapPort: number;
  smtpPort: number;
  username: string;
  password: string;
  imapSecurity: 'STARTTLS' | 'None';
  smtpSecurity: 'STARTTLS' | 'None';
};

export type MailBridgeReadyMessage = {
  imap_address: string;
  smtp_address: string;
  starttls: boolean;
};

export type MailBridgeSyncProgress = {
  percentage: number;
  completedMessages: number;
  totalMessages: number;
};

export type ControlMessage =
  | { type: 'ready'; ready: MailBridgeReadyMessage }
  | { type: 'error'; error: { code: string } }
  | { type: 'sync_started'; started: { total: number } }
  | { type: 'sync_progress'; progress: { downloaded: number; total: number; percent: number } }
  | { type: 'sync_finished'; finished: { downloaded: number; total: number; code?: string } };

export type MailBridgeControlCommand =
  | { type: 'start_session'; session: MailBridgeSession }
  | { type: 'resync' }
  | { type: 'session_updated'; update: { backend_session: { token: string } } };
export const mailNotSetupCode = 'MAIL_NOT_SETUP';
export const bridgeEncryptionKeyLength = 32;

export type MailBridgeReadyResult =
  | { data: { ready: MailBridgeReadyMessage; remaining: Buffer }; error: undefined }
  | { data: undefined; error: Error };
