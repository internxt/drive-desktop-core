import type { ClientCompatibilityState } from '@/backend/features/client-compatibility';
import { I18nModule, Language } from '@/frontend/core/i18n';

export type ClientCompatibilityTexts = {
  title: string;
  description: string;
  update: string;
};

/**
 * v1.7.2 Alexis Mora
 * The sunset date is shown in UTC because the backend announces a calendar day: in local time an announced
 * midnight UTC would read as the previous day for users west of UTC.
 */
function formatSunsetAt({ sunsetAt, language }: { sunsetAt?: string | null; language: Language }) {
  if (!sunsetAt) return;

  const date = new Date(sunsetAt);
  if (Number.isNaN(date.getTime())) return;

  return date.toLocaleDateString(language, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}

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
      return { title: texts.unsupported.title, description: texts.unsupported.description, update: texts.update };
    case 'update_recommended':
    case 'deprecated': {
      const date = formatSunsetAt({ sunsetAt: state.sunsetAt, language });
      const description = date ? texts.deprecated.descriptionWithDate.replace('{{date}}', date) : texts.deprecated.description;
      return { title: texts.deprecated.title, description, update: texts.update };
    }
  }
}
