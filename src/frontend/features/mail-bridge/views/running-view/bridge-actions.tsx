import { Warning } from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';

import { Spinner } from '@/frontend/components/spinner';

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
  isSyncing?: boolean;
  lastChecked?: number;
};

export function BridgeActions({
  labels,
  turnOffLabel,
  onResync,
  onOpenSettings,
  onTurnOff,
  isSyncing = false,
  lastChecked,
}: Readonly<Props>) {
  return (
    <div className="flex shrink-0 gap-3">
      <ResyncButton labels={labels} onResync={onResync} isSyncing={isSyncing} lastChecked={lastChecked} />
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

function ResyncButton({
  labels,
  onResync,
  isSyncing,
  lastChecked,
}: Readonly<{ labels: ResyncLabels; onResync?: () => Promise<ResyncResult>; isSyncing: boolean; lastChecked?: number }>) {
  const [state, setState] = useState<ResyncState>('idle');
  const resetTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const requestedLastChecked = useRef(lastChecked);
  const busy = isSyncing || state === 'requesting' || state === 'requested';
  const presentation = getResyncButtonPresentation({ state, labels, busy });

  useEffect(() => () => clearTimeout(resetTimeout.current), []);

  useEffect(() => {
    if (state === 'requested' && lastChecked !== requestedLastChecked.current) {
      clearTimeout(resetTimeout.current);
      setState('idle');
    }
  }, [lastChecked, state]);

  async function resync() {
    if (!onResync || busy) return;

    clearTimeout(resetTimeout.current);
    requestedLastChecked.current = lastChecked;
    setState('requesting');
    try {
      const result = await onResync();
      setState(result.error ? 'failed' : 'requested');
    } catch {
      setState('failed');
    }
    clearTimeout(resetTimeout.current);
    resetTimeout.current = setTimeout(() => setState('idle'), 3000);
  }

  return (
    <button
      type="button"
      onClick={() => void resync()}
      disabled={busy}
      aria-busy={busy}
      className="border-gray-20 bg-gray-5 flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border px-4 text-sm font-semibold text-gray-100 disabled:cursor-wait disabled:opacity-70">
      {presentation.icon}
      {presentation.label}
    </button>
  );
}

function getResyncButtonPresentation({ state, labels, busy }: Readonly<{ state: ResyncState; labels: ResyncLabels; busy: boolean }>) {
  if (busy) {
    return { label: labels.requesting, icon: <Spinner className="h-[18px] w-[18px] animate-spin" /> };
  }
  if (state === 'failed') {
    return { label: labels.failed, icon: <Warning size={18} /> };
  }
  return { label: labels.idle, icon: <ResyncIcon size={18} /> };
  }
