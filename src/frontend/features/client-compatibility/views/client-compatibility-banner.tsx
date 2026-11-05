import type { ClientCompatibilityState } from '@/backend/features/client-compatibility';
import { Banner, BannerVariant } from '@/frontend/components/banner';
import { Language } from '@/frontend/core/i18n';

import { getClientCompatibilityTexts } from '../services/get-client-compatibility-texts';

const variants: Record<ClientCompatibilityState['status'], BannerVariant | undefined> = {
  up_to_date: undefined,
  update_recommended: 'info',
  deprecated: 'info',
  unsupported: 'error',
};

type Props = {
  state: ClientCompatibilityState;
  language: Language;
  onUpdate: () => void;
};

/**
 * v1.6.1 Alexis Mora
 * It cannot be dismissed so the user always knows an update is needed
 * while an update is recommended, the version is deprecated or it is unsupported.
 */
export function ClientCompatibilityBanner({ state, language, onUpdate }: Readonly<Props>) {
  const variant = variants[state.status];
  const texts = getClientCompatibilityTexts({ state, language });
  if (!variant || !texts) return null;

  return <Banner variant={variant} message={texts.description} action={{ label: texts.update, onClick: onUpdate }} />;
}
