import { useState } from 'react';

import { Checkbox } from '@/frontend/components/checkbox';

import { useRunningMailBridge } from '../../context/running-mail-bridge.context';

type Props = {
  onClose: () => void;
  isStartOnLoginEnabled?: boolean;
  onStartOnLoginChange?: (enabled: boolean) => void | Promise<void>;
};

export function BridgeSettingsModal({ onClose, isStartOnLoginEnabled = false, onStartOnLoginChange }: Readonly<Props>) {
  const { accountEmail, translate } = useRunningMailBridge();
  const [startOnLoginEnabled, setStartOnLoginEnabled] = useState(isStartOnLoginEnabled);
  const [isSaving, setIsSaving] = useState(false);

  async function save() {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await onStartOnLoginChange?.(startOnLoginEnabled);
      onClose();
    } catch {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-5">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="mail-bridge-settings-title"
        aria-describedby="mail-bridge-settings-description"
        onKeyDown={(event) => {
          if (event.key === 'Escape' && !isSaving) onClose();
        }}
        className="border-gray-20 bg-gray-5 w-full max-w-[600px] rounded-2xl border shadow-xl">
        <div className="border-gray-20 border-b px-7 py-6">
          <h2 id="mail-bridge-settings-title" className="text-lg font-semibold text-gray-100">
            {translate('mailBridge.runningView.settings.title')}
          </h2>
          <p id="mail-bridge-settings-description" className="text-gray-60 mt-1 text-sm">
            {translate('mailBridge.runningView.settings.description', { email: accountEmail })}
          </p>
        </div>
        <div className="px-7 py-6">
          <Checkbox
            label={translate('mailBridge.turnedOffView.startOnLogin.title')}
            checked={startOnLoginEnabled}
            disabled={isSaving}
            onClick={() => setStartOnLoginEnabled(!startOnLoginEnabled)}
            customClassName="font-semibold"
          />
          <p className="text-gray-60 ml-7 mt-1 text-sm">{translate('mailBridge.runningView.settings.startOnLoginDescription')}</p>
        </div>
        <div className="border-gray-20 flex justify-end gap-3 border-t px-7 py-4">
          <button
            type="button"
            autoFocus
            disabled={isSaving}
            onClick={onClose}
            className="border-gray-20 rounded-lg border px-4 py-2 text-sm font-semibold text-gray-100">
            {translate('mailBridge.runningView.settings.cancel')}
          </button>
          <button
            type="button"
            disabled={isSaving}
            aria-busy={isSaving}
            onClick={() => void save()}
            className="bg-primary rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-70">
            {translate('mailBridge.runningView.settings.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
