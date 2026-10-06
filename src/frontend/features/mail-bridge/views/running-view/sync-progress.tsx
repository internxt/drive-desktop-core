import type { TranslationFn } from '@/frontend/core/i18n/i18n.types';

import type { MailBridgeSyncProgress } from '../../mail-bridge.types';

type Props = { progress: MailBridgeSyncProgress; translate: TranslationFn };

export function SyncProgress({ progress, translate }: Readonly<Props>) {
  const label = translate('mailBridge.runningView.decrypting', {
    percentage: progress.percentage,
    completed: progress.completedMessages,
    total: progress.totalMessages,
  });

  return (
    <div>
      <div className="text-sm">
        <span className="text-gray-80">{label}</span>
      </div>
      <div className="bg-gray-20 mt-2 h-1.5 overflow-hidden rounded-full">
        <div className="bg-primary h-full rounded-full" style={{ width: `${progress.percentage}%` }} />
      </div>
    </div>
  );
}
