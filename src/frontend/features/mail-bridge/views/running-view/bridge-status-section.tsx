import { useRunningMailBridge } from '../../context/running-mail-bridge.context';
import { BridgeActions } from './bridge-actions';
import { BridgeIdentity } from './bridge-identity';
import { SyncProgress } from './sync-progress';
import { SyncStatus } from './sync-status';

type Props = { onOpenSettings: () => void };

export function BridgeStatusSection({ onOpenSettings }: Readonly<Props>) {
  const { accountEmail, connection, syncProgress, lastChecked, language, translate, onResync, onTurnOff } = useRunningMailBridge();

  return (
    <div className="border-primary/50 bg-primary/10 rounded-2xl border p-5">
      <div className="flex items-center justify-between gap-4">
        <BridgeIdentity title={translate('mailBridge.runningView.title')} />
        <BridgeActions
          labels={{
            idle: translate('mailBridge.runningView.resync'),
            requesting: translate('mailBridge.runningView.resyncing'),
            requested: translate('mailBridge.runningView.resyncRequested'),
            failed: translate('mailBridge.runningView.resyncFailed'),
          }}
          turnOffLabel={translate('mailBridge.runningView.turnOff')}
          onResync={onResync}
          onOpenSettings={onOpenSettings}
          onTurnOff={onTurnOff}
          isSyncing={Boolean(syncProgress)}
          lastChecked={lastChecked}
        />
      </div>
      <p className="text-gray-60 mt-2 overflow-x-auto whitespace-nowrap font-mono text-sm">
        {accountEmail} · {connection.hostname} · IMAP {connection.imapPort} · SMTP {connection.smtpPort}
      </p>
      <div className="border-primary/30 mt-4 border-t pt-4" role="status" aria-live="polite">
        {syncProgress ? (
          <SyncProgress progress={syncProgress} translate={translate} />
        ) : (
          <SyncStatus lastChecked={lastChecked} language={language} translate={translate} />
        )}
      </div>
    </div>
  );
}
