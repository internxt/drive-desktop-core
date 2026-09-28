import type { LocalContextProps } from '@/frontend/frontend.types';

import { ActivationPanel } from './activation-panel';
import { SecurityNotice } from './security-notice';
import { TurnedOffHeader } from './turned-off-header';

type Props = {
  accountEmail: string;
  useTranslationContext: () => LocalContextProps;
  onActivate: () => void;
  isStartOnLoginEnabled?: boolean;
  onStartOnLoginChange?: (enabled: boolean) => void;
};

export function TurnedOffView({
  accountEmail,
  useTranslationContext,
  onActivate,
  isStartOnLoginEnabled,
  onStartOnLoginChange,
}: Readonly<Props>) {
  const { translate } = useTranslationContext();
  const description = translate('mailBridge.turnedOffView.description', { email: accountEmail });

  return (
    <section className="flex h-full w-full flex-col overflow-auto px-5 py-9">
      <TurnedOffHeader accountEmail={accountEmail} title={translate('mailBridge.turnedOffView.title')} description={description} />
      <ActivationPanel
        title={translate('mailBridge.turnedOffView.activate.title')}
        description={translate('mailBridge.turnedOffView.activate.description')}
        action={translate('mailBridge.turnedOffView.activate.action')}
        startOnLoginTitle={translate('mailBridge.turnedOffView.startOnLogin.title')}
        startOnLoginDescription={translate('mailBridge.turnedOffView.startOnLogin.description')}
        onActivate={onActivate}
        isStartOnLoginEnabled={isStartOnLoginEnabled}
        onStartOnLoginChange={onStartOnLoginChange}
      />
      <SecurityNotice text={translate('mailBridge.turnedOffView.securityNotice')} />
    </section>
  );
}
