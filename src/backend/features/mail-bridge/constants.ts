export const MAX_ALLOWED_PORT = 65_535;
export const maxControlFrameSize = 1 << 20;

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

export type ControlMessage =
  | { type: 'ready'; ready: MailBridgeReadyMessage }
  | { type: 'error'; error: { code: string } };
export const mailNotSetupCode = 'MAIL_NOT_SETUP';
export const bridgeEncryptionKeyLength = 32;
