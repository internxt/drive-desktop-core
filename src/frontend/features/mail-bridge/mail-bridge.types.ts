import type { Result } from '../../../common/result';

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
};

export type MailBridgeViewModel =
  | { status: 'stopped'; error: null }
  | { status: 'setup-required'; error: null }
  | { status: 'starting'; error: null }
  | {
      status: 'running';
      error: null;
      connection: MailBridgeConnection;
      syncProgress?: MailBridgeSyncProgress;
      lastChecked?: number;
    }
  | { status: 'error'; error: string };

export type UseMailBridgeResult = {
  viewModel: MailBridgeViewModel;
  accountEmail: string | undefined;
  isLoadingInitialStatus: boolean;
  isStartOnLoginEnabled: boolean;
  setStartOnLogin: (enabled: boolean) => Promise<void>;
  activate: () => Promise<void>;
  turnOff: () => Promise<Result<undefined, Error>>;
  retry: () => Promise<void>;
  resync: () => Promise<Result<undefined, Error>>;
};
