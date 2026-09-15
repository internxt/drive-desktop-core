import type { LocalContextProps } from '@/frontend/frontend.types';

type Props = { useTranslationContext: () => LocalContextProps };

export function ErrorView({ useTranslationContext }: Readonly<Props>) {
  const { translate } = useTranslationContext();

  return (
    <section className="flex h-full w-full items-center justify-center p-5" role="alert">
      <p className="text-red-500">{translate('mailBridge.errorView.description')}</p>
    </section>
  );
}
