import { useState } from 'react';

import type { LocalContextProps } from '@/frontend/frontend.types';

import type { MailBridgeConnection, MailBridgeSyncProgress, MailClient } from '../../mail-bridge.types';
import { BridgeSettingsModal } from './bridge-settings-modal';
import { BridgeStatusSection } from './bridge-status-section';
import { ClientSetup } from './client-setup';
import { RunningMailBridgeProvider } from '../../context/running-mail-bridge.context';

type Props = {
  accountEmail: string;
  connection: MailBridgeConnection;
  syncProgress: MailBridgeSyncProgress;
  useTranslationContext: () => LocalContextProps;
  onResync?: () => void;
  onTurnOff?: () => void;
  onSetupClient?: (client: MailClient) => Promise<void>;
  supportedClients: MailClient[];
};

export function RunningView({
  accountEmail,
  connection,
  syncProgress,
  useTranslationContext,
  onResync,
  onTurnOff,
  onSetupClient,
  supportedClients,
}: Readonly<Props>) {
  const { translate } = useTranslationContext();
  return (
    <RunningMailBridgeProvider
      value={{ accountEmail, connection, syncProgress, translate, supportedClients, onResync, onTurnOff, onSetupClient }}>
      <RunningViewContent />
    </RunningMailBridgeProvider>
  );
}

function RunningViewContent() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  return (
    <section className="relative h-full min-h-0 w-full overflow-y-auto overscroll-contain px-5 py-6">
      <BridgeStatusSection onOpenSettings={() => setIsSettingsOpen(true)} />
      <ClientSetup />
      {isSettingsOpen && <BridgeSettingsModal onClose={() => setIsSettingsOpen(false)} />}
    </section>
  );
}
