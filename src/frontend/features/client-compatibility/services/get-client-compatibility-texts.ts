import type { ClientCompatibilityState } from '@/backend/features/client-compatibility/client-compatibility.types';
import { I18nModule, Language } from '@/frontend/core/i18n';

export type ClientCompatibilityTexts = {
  title: string;
  description: string;
  update: string;
};

/**
 * v1.6.1 Alexis Mora
 * The texts are resolved from the locale objects instead of a translate function so the main process can
 * build the native notification with the same texts the widget shows, without depending on React.
 */
export function getClientCompatibilityTexts({
  state,
  language,
}: {
  state: ClientCompatibilityState;
  language: Language;
}): ClientCompatibilityTexts | undefined {
  const texts = I18nModule[language].clientCompatibility;

  switch (state.status) {
    case 'up_to_date':
      return undefined;
    case 'unsupported':
      return { ...texts.unsupported, update: texts.update };
    case 'update_recommended':
    case 'deprecated':
      return { ...texts.deprecated, update: texts.update };
  }
}
