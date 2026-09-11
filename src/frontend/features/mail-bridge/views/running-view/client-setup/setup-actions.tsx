import { CaretDown, Lightning } from '@phosphor-icons/react';

import type { TranslationFn } from '@/frontend/core/i18n/i18n.types';

import type { MailClient } from '../../../mail-bridge.types';

type Props = { client: MailClient; showManualSettings: boolean; onToggleManualSettings: () => void; useTranslation: TranslationFn };

const clientLabels: Record<MailClient, string> = { outlook: 'Outlook', thunderbird: 'Thunderbird', other: 'Other' };

export function SetupActions({ client, showManualSettings, onToggleManualSettings, useTranslation }: Readonly<Props>) {
  return (
    <div className="mt-4 flex items-center gap-4">
      <button className="bg-primary flex h-11 items-center gap-2 rounded-lg px-5 font-semibold text-white">
        <Lightning size={20} />
        {useTranslation('mailBridge.runningView.clientSetup.setupAutomatically', { client: clientLabels[client] })}
      </button>
      <button onClick={onToggleManualSettings} className="text-primary flex items-center gap-2 text-sm font-semibold">
        <CaretDown size={16} className={showManualSettings ? '' : '-rotate-90'} />
        {useTranslation('mailBridge.runningView.clientSetup.hideManualSettings')}
      </button>
    </div>
  );
}
