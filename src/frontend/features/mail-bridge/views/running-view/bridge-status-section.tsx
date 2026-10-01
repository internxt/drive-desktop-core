import { useRunningMailBridge } from '../../context/running-mail-bridge.context';
import { BridgeActions } from './bridge-actions';
import { BridgeIdentity } from './bridge-identity';
import { SyncProgress } from './sync-progress';

type Props = { onOpenSettings: () => void };

export function BridgeStatusSection({ onOpenSettings }: Readonly<Props>) {
  const { accountEmail, connection, syncProgress, translate, onResync, onTurnOff } = useRunningMailBridge();

  return (
    <div className="border-primary/50 bg-primary/10 rounded-2xl border p-5">
      <div className="flex items-start justify-between gap-4">
        <BridgeIdentity accountEmail={accountEmail} connection={connection} title={translate('mailBridge.runningView.title')} />
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
        />
      </div>
      {syncProgress && <SyncProgress progress={syncProgress} translate={translate} />}
    </div>
  );
}
