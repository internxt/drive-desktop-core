import type { LocalContextProps } from '@/frontend/frontend.types';

type Props = { useTranslationContext: () => LocalContextProps };

export function SetupRequiredView({ useTranslationContext }: Readonly<Props>) {
  const { translate } = useTranslationContext();

  return (
    <section className="flex h-full w-full items-center justify-center p-5" role="status">
      <p className="max-w-md text-center text-gray-100">{translate('mailBridge.setupRequiredView.description')}</p>
    </section>
  );
}
