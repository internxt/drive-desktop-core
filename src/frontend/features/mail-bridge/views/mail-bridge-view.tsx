import type { UserAvailableProducts } from '@/backend/features/payments/payments.types';
import type { LocalContextProps } from '@/frontend/frontend.types';

import type { MailBridgeViewModel } from '../mail-bridge.types';
import { LockedView } from './locked-view';
import { RunningView } from './running-view';
import { StartingView } from './starting-view';
import { SetupRequiredView } from './setup-required-view';
import { TurnedOffView } from './turned-off-view';
import { ErrorView } from './error-view';

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
  onRetry: () => void;
  onViewLogs: () => void;
  onContactSupport: () => void;
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
  onRetry,
  onViewLogs,
  onContactSupport,
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

  if (viewModel.status === 'setup-required') return <SetupRequiredView useTranslationContext={useTranslationContext} />;

  if (viewModel.status === 'running') {
    return (
      <RunningView
        accountEmail={accountEmail}
        connection={viewModel.connection}
        syncProgress={viewModel.syncProgress}
        useTranslationContext={useTranslationContext}
        onResync={onResync}
        onTurnOff={onTurnOff}
      />
    );
  }

  if (viewModel.status === 'starting') {
    return <StartingView useTranslationContext={useTranslationContext} />;
  }

  return (
    <ErrorView
      error={viewModel.error}
      useTranslationContext={useTranslationContext}
      onRetry={onRetry}
      onViewLogs={onViewLogs}
      onContactSupport={onContactSupport}
      onTurnOff={onTurnOff}
    />
  );
}
