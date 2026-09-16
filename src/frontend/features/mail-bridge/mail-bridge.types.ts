export type MailBridgeStatus = 'stopped' | 'starting' | 'running' | 'error';
export type MailBridgeConnection = {
  hostname: string;
  imapPort: number;
  smtpPort: number;
  username: string;
  password: string;
  imapSecurity: string;
  smtpSecurity: string;
};

export type MailBridgeSyncProgress = {
  percentage: number;
  completedMessages: number;
  totalMessages: number;
  estimatedMinutesRemaining: number;
};

export type MailBridgeViewModel =
  | { status: 'stopped'; error: null }
  | { status: 'setup-required'; error: null }
  | { status: 'starting'; error: null }
  | {
      status: 'running';
      error: null;
      connection: MailBridgeConnection;
      syncProgress: MailBridgeSyncProgress;
    }
  | { status: 'error'; error: string };
