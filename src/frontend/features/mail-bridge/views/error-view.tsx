import { ArrowsClockwise, Warning } from '@phosphor-icons/react';
import type { LocalContextProps } from '@/frontend/frontend.types';

type Props = {
  error: string;
  useTranslationContext: () => LocalContextProps;
  onRetry: () => void;
  onViewLogs: () => void;
  onContactSupport: () => void;
  onTurnOff?: () => void;
};

export function ErrorView({ error, useTranslationContext, onRetry, onViewLogs, onContactSupport, onTurnOff }: Readonly<Props>) {
  const { translate } = useTranslationContext();
  const details = getMailBridgeErrorDetails({ error, translate });

  return (
    <section className="h-full w-full overflow-y-auto overscroll-contain py-3" role="alert">
      <div className="flex items-start gap-4">
        <div className="border-gray-20 text-gray-80 grid h-14 w-14 shrink-0 place-items-center rounded-xl border">
          <Warning size={28} />
        </div>
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-gray-100">{translate('mailBridge.errorView.title')}</h1>
          <p className="text-gray-70 mt-1 max-w-[650px] text-sm leading-relaxed">{translate('mailBridge.errorView.description')}</p>
        </div>
      </div>

      <div className="border-gray-20 bg-gray-5 mt-7 flex items-center justify-between gap-4 rounded-2xl border p-5">
        <div className="min-w-0">
          <h2 className="font-semibold text-gray-100">{details.title}</h2>
          <p className="text-gray-60 mt-1 text-sm">{details.description}</p>
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="bg-primary flex h-11 shrink-0 items-center gap-2 rounded-lg px-5 text-sm font-semibold text-white">
          <ArrowsClockwise size={18} />
          {translate('mailBridge.errorView.tryAgain')}
        </button>
      </div>

      <div className="mt-5 flex items-center justify-between gap-4 text-sm font-semibold">
        <div className="flex items-center gap-5">
          <button type="button" onClick={onViewLogs} className="text-primary">
            {translate('mailBridge.errorView.viewLogs')}
          </button>
          <button type="button" onClick={onContactSupport} className="text-primary">
            {translate('mailBridge.errorView.contactSupport')}
          </button>
        </div>
        {onTurnOff && (
          <button type="button" onClick={onTurnOff} className="text-gray-60">
            {translate('mailBridge.errorView.leaveOff')}
          </button>
        )}
      </div>
    </section>
  );
}

function getMailBridgeErrorDetails({ error, translate }: { error: string; translate: LocalContextProps['translate'] }) {
  const port = error.match(/(?:127\.0\.0\.1|localhost|\[::1\]):(\d+)/)?.[1];
  if (port && /EADDRINUSE|address already in use|only one usage/i.test(error)) {
    return {
      title: translate('mailBridge.errorView.portInUse.title', { port }),
      description: translate('mailBridge.errorView.portInUse.description', { port }),
    };
  }

  return {
    title: translate('mailBridge.errorView.generic.title'),
    description: translate('mailBridge.errorView.generic.description'),
  };
}
