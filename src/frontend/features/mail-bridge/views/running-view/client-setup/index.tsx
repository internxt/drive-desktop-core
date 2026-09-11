import { useState } from 'react';

import type { MailClient } from '../../../mail-bridge.types';
import { useRunningMailBridge } from '../../../context/running-mail-bridge.context';
import { ClientPicker } from './client-picker';
import { ManualSettings } from './manual-settings';
import { SetupActions } from './setup-actions';

export function ClientSetup() {
  const { connection, translate: useTranslation, supportedClients, onSetupClient } = useRunningMailBridge();
  const [selectedClient, setSelectedClient] = useState<MailClient | null>(supportedClients[0] ?? null);
  const [showManualSettings, setShowManualSettings] = useState(true);

  function handleClientSelection(client: MailClient) {
    setSelectedClient(client);
    setShowManualSettings(client === 'other');
  }

  return (
    <div className="mt-6">
      <h2 className="font-semibold text-gray-100">{useTranslation('mailBridge.runningView.clientSetup.title')}</h2>
      <p className="text-gray-60 mt-1 text-sm">{useTranslation('mailBridge.runningView.clientSetup.description')}</p>
      <ClientPicker clients={supportedClients} selectedClient={selectedClient} onSelectClient={handleClientSelection} />
      {selectedClient && selectedClient !== 'other' && (
        <SetupActions client={selectedClient} onSetupClient={onSetupClient} useTranslation={useTranslation} />
      )}
      {showManualSettings && <ManualSettings connection={connection} useTranslation={useTranslation} />}
      <p className="text-gray-60 mt-5 text-sm">{useTranslation('mailBridge.runningView.clientSetup.notice')}</p>
    </div>
  );
}
