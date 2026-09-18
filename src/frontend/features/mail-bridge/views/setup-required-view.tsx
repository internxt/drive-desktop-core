import { ArrowsClockwise, At, ArrowSquareOut } from '@phosphor-icons/react';
import { useState } from 'react';
import type { LocalContextProps } from '@/frontend/frontend.types';

type Props = {
  accountEmail: string;
  useTranslationContext: () => LocalContextProps;
  onCreateMailbox: () => void;
  onCheckMailbox: () => Promise<void>;
};

export function SetupRequiredView({ accountEmail, useTranslationContext, onCreateMailbox, onCheckMailbox }: Readonly<Props>) {
  const { translate } = useTranslationContext();
  const [isChecking, setIsChecking] = useState(false);

  async function checkMailbox() {
    setIsChecking(true);
    await onCheckMailbox();
    setIsChecking(false);
  }

  return (
    <section className="h-full w-full overflow-y-auto overscroll-contain py-3" role="status">
      <div className="flex items-start gap-4">
        <div className="border-gray-20 text-gray-80 grid h-14 w-14 shrink-0 place-items-center rounded-xl border">
          <At size={28} />
        </div>
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-gray-100">{translate('mailBridge.setupRequiredView.title')}</h1>
          <p className="text-gray-70 mt-1 max-w-[650px] text-sm leading-relaxed">{translate('mailBridge.setupRequiredView.description')}</p>
        </div>
      </div>

      <div className="border-gray-20 bg-gray-5 mt-7 rounded-2xl border p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold text-gray-100">{translate('mailBridge.setupRequiredView.card.title')}</h2>
            <p className="text-gray-60 mt-1 text-sm">{translate('mailBridge.setupRequiredView.card.description', { email: accountEmail })}</p>
          </div>
          <button
            type="button"
            onClick={onCreateMailbox}
            className="bg-primary flex h-11 shrink-0 items-center gap-2 rounded-lg px-5 text-sm font-semibold text-white">
            <ArrowSquareOut size={18} />
            {translate('mailBridge.setupRequiredView.card.action')}
          </button>
        </div>

        <ol className="border-gray-20 mt-5 space-y-3 border-t pt-5 text-sm text-gray-80">
          <SetupStep number={1} text={translate('mailBridge.setupRequiredView.steps.chooseAddress')} />
          <SetupStep number={2} text={translate('mailBridge.setupRequiredView.steps.returnToBridge')} />
          <SetupStep number={3} text={translate('mailBridge.setupRequiredView.steps.activate')} />
        </ol>
      </div>

      <div className="mt-5 flex items-center gap-4">
        <button
          type="button"
          onClick={() => void checkMailbox()}
          disabled={isChecking}
          className="border-gray-20 bg-gray-5 flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-semibold text-gray-100 disabled:cursor-wait">
          <ArrowsClockwise size={18} className={isChecking ? 'animate-spin' : undefined} />
          {translate('mailBridge.setupRequiredView.checkMailbox')}
        </button>
        <p className="text-gray-60 text-sm">{translate('mailBridge.setupRequiredView.notice')}</p>
      </div>
    </section>
  );
}

function SetupStep({ number, text }: Readonly<{ number: number; text: string }>) {
  return (
    <li className="flex items-center gap-3">
      <span className="border-gray-20 text-gray-80 grid h-6 w-6 shrink-0 place-items-center rounded-full border text-xs font-semibold">
        {number}
      </span>
      {text}
    </li>
  );
}
