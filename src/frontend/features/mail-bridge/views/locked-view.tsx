import type { LocalContextProps } from '@/frontend/frontend.types';

import { FeatureCard } from '../components/feature-card';
import { CloudIcon } from '../icons/cloud-icon';
import { EnvelopeSimpleIcon } from '../icons/envelope-simple-icon';
import { LockIcon } from '../icons/lock-icon';
import { LockedKeyIcon } from '../icons/locked-key-icon';

type Props = {
  useTranslationContext: () => LocalContextProps;
  onUpgradePlan: () => void;
  onComparePlans: () => void;
};

export function LockedView({ useTranslationContext, onUpgradePlan, onComparePlans }: Readonly<Props>) {
  const { translate } = useTranslationContext();
  const iconsSize = 18;
  return (
    <section className="flex h-full w-full flex-col items-center overflow-auto px-8 py-9 text-center">
      <div className="border-gray-20 text-gray-70 grid h-12 w-12 place-items-center rounded-xl border">
        <LockedKeyIcon size={22} />
      </div>
      <h1 className="mt-5 text-[22px] font-semibold tracking-tight text-gray-100">{translate('mailBridge.lockedView.title')}</h1>
      <p className="text-gray-70 mt-2 max-w-[490px] text-[14px] leading-relaxed">{translate('mailBridge.lockedView.description')}</p>
      <div className="mt-6 grid w-full max-w-[630px] grid-cols-3 gap-3 text-left">
        <FeatureCard
          icon={<EnvelopeSimpleIcon size={iconsSize} />}
          title={translate('mailBridge.lockedView.features.anyClient.title')}
          description={translate('mailBridge.lockedView.features.anyClient.description')}
        />
        <FeatureCard
          icon={<LockIcon size={iconsSize} />}
          title={translate('mailBridge.lockedView.features.localDecryption.title')}
          description={translate('mailBridge.lockedView.features.localDecryption.description')}
        />
        <FeatureCard
          icon={<CloudIcon size={iconsSize} />}
          title={translate('mailBridge.lockedView.features.sameAccount.title')}
          description={translate('mailBridge.lockedView.features.sameAccount.description')}
        />
      </div>
      <div className="mt-6 flex items-center gap-4">
        <button onClick={onUpgradePlan} className="bg-primary h-10 rounded-lg px-5 text-sm font-semibold text-white">
          {translate('mailBridge.lockedView.upgradePlan')}
        </button>
        <button onClick={onComparePlans} className="text-primary text-sm font-semibold">
          {translate('mailBridge.lockedView.comparePlans')}
        </button>
      </div>
    </section>
  );
}
