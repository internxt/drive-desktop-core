export type MailBridgeStatus = 'stopped' | 'starting' | 'running' | 'error';

export type MailBridgeViewModel = {
  status: MailBridgeStatus;
  error: string | null;
};
