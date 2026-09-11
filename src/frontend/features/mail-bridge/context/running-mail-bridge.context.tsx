import { createContext, useContext } from 'react';

import type { TranslationFn } from '@/frontend/core/i18n/i18n.types';

import type { MailBridgeConnection, MailBridgeSyncProgress, MailClient } from '../mail-bridge.types';

type RunningMailBridgeContextValue = {
  accountEmail: string;
  connection: MailBridgeConnection;
  syncProgress: MailBridgeSyncProgress;
  translate: TranslationFn;
  supportedClients: MailClient[];
  onSetupClient?: (client: MailClient) => Promise<void>;
  onResync?: () => void;
  onTurnOff?: () => void;
};

const RunningMailBridgeContext = createContext<RunningMailBridgeContextValue | null>(null);

export function RunningMailBridgeProvider({
  value,
  children,
}: Readonly<{ value: RunningMailBridgeContextValue; children: React.ReactNode }>) {
  return <RunningMailBridgeContext.Provider value={value}>{children}</RunningMailBridgeContext.Provider>;
}

export function useRunningMailBridge() {
  const context = useContext(RunningMailBridgeContext);
  if (!context) throw new Error('useRunningMailBridge must be used inside RunningMailBridgeProvider');
  return context;
}
