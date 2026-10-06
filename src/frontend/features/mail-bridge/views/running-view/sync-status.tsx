import { CheckCircle } from '@phosphor-icons/react';

import type { Language, TranslationFn } from '@/frontend/core/i18n/i18n.types';

type Props = { lastChecked?: number; language: Language; translate: TranslationFn };

export function SyncStatus({ lastChecked, language, translate }: Readonly<Props>) {
  if (lastChecked === undefined) return <p className="text-gray-60 text-sm">{translate('mailBridge.runningView.waitingForSync')}</p>;

  const time = new Date(lastChecked).toLocaleTimeString(language, { hour: '2-digit', minute: '2-digit', hour12: false });

  return (
    <div className="text-gray-60 flex items-center gap-2 text-sm">
      <CheckCircle className="text-green shrink-0" size={18} weight="fill" aria-hidden="true" />
      <span>{translate('mailBridge.runningView.upToDate', { time })}</span>
    </div>
  );
}
