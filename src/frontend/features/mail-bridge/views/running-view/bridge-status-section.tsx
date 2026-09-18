import type { TranslationFn } from '@/frontend/core/i18n/i18n.types';

import { ResyncIcon } from '../../icons/resync-icon';
import { RunningStatusIcon } from '../../icons/running-status-icon';
import { SettingsIcon } from '../../icons/settings-icon';
import { TurnOffIcon } from '../../icons/turn-off-icon';
import type { MailBridgeConnection, MailBridgeSyncProgress } from '../../mail-bridge.types';
import { useRunningMailBridge } from '../../context/running-mail-bridge.context';

type Props = { onOpenSettings: () => void };

export function BridgeStatusSection({ onOpenSettings }: Readonly<Props>) {
  const { accountEmail, connection, syncProgress, translate, onResync, onTurnOff } = useRunningMailBridge();
  return (
    <div className="border-primary/50 bg-primary/10 rounded-2xl border p-5">
      <div className="flex items-start justify-between gap-4">
        <BridgeIdentity accountEmail={accountEmail} connection={connection} title={translate('mailBridge.runningView.title')} />
        <BridgeActions
          resyncLabel={translate('mailBridge.runningView.resync')}
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

function BridgeIdentity({
  accountEmail,
  connection,
  title,
}: Readonly<{ accountEmail: string; connection: MailBridgeConnection; title: string }>) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="text-green">
        <RunningStatusIcon size={14} />
      </span>
      <div className="min-w-0">
        <h1 className="font-semibold text-gray-100">{title}</h1>
        <p className="text-gray-60 text-sm">
          {accountEmail} · {connection.hostname} · IMAP {connection.imapPort} · SMTP {connection.smtpPort}
        </p>
      </div>
    </div>
  );
}

function BridgeActions({
  resyncLabel,
  turnOffLabel,
  onResync,
  onOpenSettings,
  onTurnOff,
}: Readonly<{ resyncLabel: string; turnOffLabel: string; onResync?: () => void; onOpenSettings: () => void; onTurnOff?: () => void }>) {
  return (
    <div className="flex shrink-0 gap-3">
      <button
        onClick={onResync}
        className="border-gray-20 bg-gray-5 flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border px-4 text-sm font-semibold text-gray-100">
        <ResyncIcon size={18} />
        {resyncLabel}
      </button>
      <button
        onClick={onOpenSettings}
        className="border-gray-20 bg-gray-5 text-gray-60 grid h-10 w-10 place-items-center rounded-lg border">
        <SettingsIcon size={20} />
      </button>
      <button
        onClick={onTurnOff}
        className="border-gray-20 bg-gray-5 flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border px-4 text-sm font-semibold text-gray-100">
        <TurnOffIcon size={18} />
        {turnOffLabel}
      </button>
    </div>
  );
}

function SyncProgress({ progress, translate }: Readonly<{ progress: MailBridgeSyncProgress; translate: TranslationFn }>) {
  const label = translate('mailBridge.runningView.decrypting', {
    percentage: progress.percentage,
    completed: progress.completedMessages,
    total: progress.totalMessages,
  });

  return (
    <div className="border-primary/30 mt-4 border-t pt-4">
      <div className="text-sm">
        <span className="text-gray-80">{label}</span>
      </div>
      <div className="bg-gray-20 mt-2 h-1.5 overflow-hidden rounded-full">
        <div className="bg-primary h-full rounded-full" style={{ width: `${progress.percentage}%` }} />
      </div>
    </div>
  );
}
