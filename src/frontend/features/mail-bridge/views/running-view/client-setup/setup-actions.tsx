import { Lightning } from '@phosphor-icons/react';
import { useState } from 'react';

import type { TranslationFn } from '@/frontend/core/i18n/i18n.types';
import { Spinner } from '@/frontend/components/spinner';

import type { MailClient } from '../../../mail-bridge.types';

type Props = {
  client: Exclude<MailClient, 'other'>;
  onSetupClient?: (client: MailClient) => Promise<void>;
  useTranslation: TranslationFn;
};

const clientLabels: Record<MailClient, string> = { outlook: 'Outlook', thunderbird: 'Thunderbird', other: 'Other' };

export function SetupActions({ client, onSetupClient, useTranslation }: Readonly<Props>) {
  const [isSettingUp, setIsSettingUp] = useState(false);

  async function handleSetup() {
    if (!onSetupClient) return;

    setIsSettingUp(true);
    try {
      await onSetupClient(client);
    } finally {
      setIsSettingUp(false);
    }
  }

  return (
    <div className="mt-4 flex items-center gap-4">
      <button
        onClick={() => void handleSetup()}
        disabled={!onSetupClient || isSettingUp}
        className="bg-primary flex h-11 items-center gap-2 rounded-lg px-5 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
        {isSettingUp ? <Spinner className="h-5 w-5 animate-spin" /> : <Lightning size={20} />}
        {useTranslation('mailBridge.runningView.clientSetup.setupAutomatically', { client: clientLabels[client] })}
      </button>
    </div>
  );
}
