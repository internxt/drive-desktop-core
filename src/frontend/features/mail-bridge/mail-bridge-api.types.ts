import type {
  MailBridgeConnectionSettings,
  MailBridgeSessionPreparationErrorCode,
  MailBridgeStatus,
  MailBridgeSyncProgress,
} from '../../../backend/features/mail-bridge';
import type { Result } from '../../../common/result';

/** The host app supplies its IPC adapter so the hook never accesses Electron directly. */
export type MailBridgeApi = {
  start: () => Promise<Result<MailBridgeConnectionSettings, Error & { code: string }>>;
  getStatus: () => Promise<MailBridgeStatus>;
  getEmail: () => Promise<Result<string, Error & { code: MailBridgeSessionPreparationErrorCode }>>;
  getStartOnLogin: () => Promise<boolean>;
  setStartOnLogin: (enabled: boolean) => Promise<void>;
  stop: () => Promise<Result<undefined, Error>>;
  resync: () => Promise<Result<undefined, Error>>;
  getSyncProgress: () => Promise<MailBridgeSyncProgress | undefined>;
  onStatusChanged: (callback: (status: MailBridgeStatus) => void) => () => void;
  onSyncProgressChanged: (callback: (progress: MailBridgeSyncProgress | undefined) => void) => () => void;
};
