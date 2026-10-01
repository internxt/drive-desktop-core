import { Check, Warning } from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';

import { ResyncIcon } from '../../icons/resync-icon';
import { SettingsIcon } from '../../icons/settings-icon';
import { TurnOffIcon } from '../../icons/turn-off-icon';

type ResyncState = 'idle' | 'requesting' | 'requested' | 'failed';
type ResyncResult = { data: undefined; error: Error | undefined };
type ResyncLabels = { idle: string; requesting: string; requested: string; failed: string };
type Props = {
  labels: ResyncLabels;
  turnOffLabel: string;
  onResync?: () => Promise<ResyncResult>;
  onOpenSettings: () => void;
  onTurnOff?: () => void;
};

export function BridgeActions({ labels, turnOffLabel, onResync, onOpenSettings, onTurnOff }: Readonly<Props>) {
  return (
    <div className="flex shrink-0 gap-3">
      <ResyncButton labels={labels} onResync={onResync} />
      <button
        type="button"
        onClick={onOpenSettings}
        className="border-gray-20 bg-gray-5 text-gray-60 grid h-10 w-10 place-items-center rounded-lg border">
        <SettingsIcon size={20} />
      </button>
      <button
        type="button"
        onClick={onTurnOff}
        className="border-gray-20 bg-gray-5 flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border px-4 text-sm font-semibold text-gray-100">
        <TurnOffIcon size={18} />
        {turnOffLabel}
      </button>
    </div>
  );
}

function ResyncButton({ labels, onResync }: Readonly<{ labels: ResyncLabels; onResync?: () => Promise<ResyncResult> }>) {
  const [state, setState] = useState<ResyncState>('idle');
  const resetTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const presentation = getResyncButtonPresentation({ state, labels });

  useEffect(() => () => clearTimeout(resetTimeout.current), []);

  async function resync() {
    if (!onResync) return;

    setState('requesting');
    const result = await onResync();
    if (result.error) {
      setState('failed');
    } else {
      setState('requested');
    }
    clearTimeout(resetTimeout.current);
    resetTimeout.current = setTimeout(() => setState('idle'), 3000);
  }

  return (
    <button
      type="button"
      onClick={() => void resync()}
      disabled={state === 'requesting'}
      className="border-gray-20 bg-gray-5 flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border px-4 text-sm font-semibold text-gray-100 disabled:cursor-wait disabled:opacity-70">
      {presentation.icon}
      {presentation.label}
    </button>
  );
}

function getResyncButtonPresentation({ state, labels }: Readonly<{ state: ResyncState; labels: ResyncLabels }>) {
  switch (state) {
    case 'requesting':
      return { label: labels.requesting, icon: <ResyncIcon size={18} /> };
    case 'requested':
      return { label: labels.requested, icon: <Check size={18} /> };
    case 'failed':
      return { label: labels.failed, icon: <Warning size={18} /> };
    default:
      return { label: labels.idle, icon: <ResyncIcon size={18} /> };
  }
}
