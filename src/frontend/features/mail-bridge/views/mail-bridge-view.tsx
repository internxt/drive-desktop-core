import type { UserAvailableProducts } from '@/backend/features/payments/payments.types';
import type { LocalContextProps } from '@/frontend/frontend.types';

import type { MailBridgeViewModel } from '../mail-bridge.types';
import { LockedView } from './locked-view';
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

  return null;
}
