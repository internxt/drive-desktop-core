import { useEffect, useRef, useState } from 'react';

import type { MailBridgeStatus, MailBridgeSyncProgress } from '../../../../backend/features/mail-bridge';
import { Result } from '../../../../common/result';
import type { MailBridgeApi } from '../mail-bridge-api.types';
import type { MailBridgeViewModel } from '../mail-bridge.types';

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

const unexpectedMailBridgeError = 'unexpected-mail-bridge-error';

/**
 * Coordinates the Mail Bridge settings view through an injected host API.
 * Loads the initial state, subscribes to live status and sync updates, and exposes
 * activation, retry, shutdown, resync, and start-on-login actions. Subscriptions
 * are removed when the hook unmounts or the API changes.
 *
 * @param api - A stable adapter implementing the host application's Mail Bridge IPC calls.
 * @returns The current view model, account details, preferences, and user actions.
 */
export function useMailBridge(api: MailBridgeApi): UseMailBridgeResult {
  const [viewModel, setViewModel] = useState<MailBridgeViewModel>({ status: 'stopped', error: null });
  const [syncProgress, setSyncProgress] = useState<MailBridgeSyncProgress | undefined>();
  const syncProgressRevision = useRef(0);
  const statusRevision = useRef(0);
  const [isLoadingInitialStatus, setIsLoadingInitialStatus] = useState(true);
  const [isStartOnLoginEnabled, setIsStartOnLoginEnabled] = useState(false);
  const [accountEmail, setAccountEmail] = useState<string | undefined>();

  function applyStatus(status: MailBridgeStatus) {
    if (status.status === 'stopped' || status.status === 'error') applySyncProgress(undefined);
    if (status.status === 'stopped') setViewModel({ status: 'stopped', error: null });
    if (status.status === 'starting') setViewModel({ status: 'starting', error: null });
    if (status.status === 'running')
      setViewModel({ status: 'running', error: null, connection: status.connection, lastChecked: status.lastChecked });
    if (status.status === 'error') setViewModel({ status: 'error', error: status.error });
  }

  function applySyncProgress(syncProgress: MailBridgeSyncProgress | undefined) {
    syncProgressRevision.current += 1;
    setSyncProgress(syncProgress);
  }

  function applyLiveStatus(status: MailBridgeStatus) {
    statusRevision.current += 1;
    applyStatus(status);
  }

  function applyMailAccountEmail(result: Awaited<ReturnType<MailBridgeApi['getEmail']>>) {
    if (Result.isError(result)) {
      setAccountEmail(undefined);
      if (result.error.code === 'mail-not-setup') {
        setViewModel({ status: 'setup-required', error: null });
        return;
      }

      setViewModel({ status: 'error', error: result.error.message });
      return;
    }

    setAccountEmail(result.data);
  }

  useEffect(() => {
    const unsubscribeFromStatus = api.onStatusChanged(applyLiveStatus);
    const unsubscribeFromSyncProgress = api.onSyncProgressChanged(applySyncProgress);
    void loadInitialState();

    return () => {
      unsubscribeFromStatus();
      unsubscribeFromSyncProgress();
    };
  }, [api]);

  async function activate() {
    setViewModel({ status: 'starting', error: null });

    try {
      const result = await api.start();
      if (result.error || !result.data) {
        if (result.error?.code === 'mail-not-setup') {
          setViewModel({ status: 'setup-required', error: null });
          return;
        }
        setViewModel({ status: 'error', error: result.error?.message ?? unexpectedMailBridgeError });
        return;
      }

      setViewModel((current) => ({
        status: 'running',
        error: null,
        connection: result.data,
        lastChecked: current.status === 'running' ? current.lastChecked : undefined,
      }));
      const revision = syncProgressRevision.current;
      const [email, progress] = await Promise.all([api.getEmail(), api.getSyncProgress()]);
      applyMailAccountEmail(email);
      if (revision === syncProgressRevision.current) setSyncProgress(progress);
    } catch {
      setViewModel({ status: 'error', error: unexpectedMailBridgeError });
    }
  }

  async function turnOff() {
    try {
      const result = await api.stop();
      if (result.error) {
        setViewModel({ status: 'error', error: result.error.message });
        return { data: undefined, error: new Error(result.error.message) };
      }
      return { data: undefined, error: undefined };
    } catch {
      setViewModel({ status: 'error', error: unexpectedMailBridgeError });
      return { data: undefined, error: new Error(unexpectedMailBridgeError) };
    }
  }

  async function retry() {
    const stopped = await turnOff();
    if (stopped.error) return;
    await activate();
  }

  async function resync() {
    try {
      const result = await api.resync();
      return result.error ? { data: undefined, error: new Error(result.error.message) } : { data: undefined, error: undefined };
    } catch {
      return { data: undefined, error: new Error(unexpectedMailBridgeError) };
    }
  }

  async function setStartOnLogin(enabled: boolean) {
    try {
      await api.setStartOnLogin(enabled);
      setIsStartOnLoginEnabled(enabled);
    } catch {
      setViewModel({ status: 'error', error: unexpectedMailBridgeError });
    }
  }

  async function loadInitialState() {
    const revision = syncProgressRevision.current;
    const initialStatusRevision = statusRevision.current;
    try {
      const [status, syncProgress, startOnLogin, email] = await Promise.all([
        api.getStatus(),
        api.getSyncProgress(),
        api.getStartOnLogin(),
        api.getEmail(),
      ]);
      if (initialStatusRevision === statusRevision.current) applyStatus(status);
      // Live events can arrive while the initial IPC requests are pending.
      if (revision === syncProgressRevision.current) setSyncProgress(syncProgress);
      setIsStartOnLoginEnabled(startOnLogin);
      applyMailAccountEmail(email);
    } catch {
      setViewModel({ status: 'error', error: unexpectedMailBridgeError });
    } finally {
      setIsLoadingInitialStatus(false);
    }
  }

  const currentViewModel = viewModel.status === 'running' && syncProgress ? { ...viewModel, syncProgress } : viewModel;

  return {
    viewModel: currentViewModel,
    accountEmail,
    isLoadingInitialStatus,
    isStartOnLoginEnabled,
    setStartOnLogin,
    activate,
    turnOff,
    retry,
    resync,
  };
}
