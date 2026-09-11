import type { UserAvailableProducts } from '@/backend/features/payments/payments.types';
import type { LocalContextProps } from '@/frontend/frontend.types';

import type { MailBridgeViewModel, MailClient } from '../mail-bridge.types';
import { LockedView } from './locked-view';
import { RunningView } from './running-view';
import { TurnedOffView } from './turned-off-view';

type Props = {
  availableProducts?: UserAvailableProducts;
  viewModel?: MailBridgeViewModel;
  accountEmail: string;
  useTranslationContext: () => LocalContextProps;
  onUpgradePlan: () => void;
  onComparePlans: () => void;
  onActivate: () => void;
  isStartOnLoginEnabled?: boolean;
  onStartOnLoginChange?: (enabled: boolean) => void;
  onResync?: () => void;
  onTurnOff?: () => void;
  supportedClients: MailClient[];
};

const initialViewModel: MailBridgeViewModel = {
  status: 'stopped',
  error: null,
};

export function MailBridgeView({
  availableProducts,
  viewModel = initialViewModel,
  accountEmail,
  useTranslationContext,
  onUpgradePlan,
  onComparePlans,
  onActivate,
  isStartOnLoginEnabled,
  onStartOnLoginChange,
  onResync,
  onTurnOff,
  supportedClients,
}: Readonly<Props>) {
  if (!availableProducts?.mail) {
    return <LockedView useTranslationContext={useTranslationContext} onUpgradePlan={onUpgradePlan} onComparePlans={onComparePlans} />;
  }

  if (viewModel.status === 'stopped') {
    return (
      <TurnedOffView
        accountEmail={accountEmail}
        useTranslationContext={useTranslationContext}
        onActivate={onActivate}
        isStartOnLoginEnabled={isStartOnLoginEnabled}
        onStartOnLoginChange={onStartOnLoginChange}
      />
    );
  }

  if (viewModel.status === 'running') {
    return (
      <RunningView
        accountEmail={accountEmail}
        connection={viewModel.connection}
        syncProgress={viewModel.syncProgress}
        useTranslationContext={useTranslationContext}
        onResync={onResync}
        onTurnOff={onTurnOff}
        supportedClients={supportedClients}
      />
    );
  }

  return null;
}
