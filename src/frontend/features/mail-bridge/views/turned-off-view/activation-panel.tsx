import { useState } from 'react';

import { Checkbox } from '@/frontend/components/checkbox';

import { ActivateMailBridgeButton } from './activate-mail-bridge-button';
type Props = {
  title: string;
  description: string;
  action: string;
  startOnLoginTitle: string;
  startOnLoginDescription: string;
  onActivate: () => void;
  isStartOnLoginEnabled?: boolean;
  onStartOnLoginChange?: (enabled: boolean) => void;
};

export function ActivationPanel({
  title,
  description,
  action,
  startOnLoginTitle,
  startOnLoginDescription,
  onActivate,
  isStartOnLoginEnabled,
  onStartOnLoginChange,
}: Readonly<Props>) {
  const [localStartOnLoginEnabled, setLocalStartOnLoginEnabled] = useState(false);
  const startOnLoginEnabled = isStartOnLoginEnabled ?? localStartOnLoginEnabled;

  function handleStartOnLoginChange(enabled: boolean) {
    if (isStartOnLoginEnabled === undefined) setLocalStartOnLoginEnabled(enabled);
    onStartOnLoginChange?.(enabled);
  }

  return (
    <div className="border-gray-20 bg-gray-5 mt-7 rounded-2xl border p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-semibold text-gray-100">{title}</h2>
          <p className="text-gray-60 mt-1 text-sm">{description}</p>
        </div>
        <ActivateMailBridgeButton label={action} onClick={onActivate} />
      </div>

      <div className="border-gray-20 mt-6 border-t pt-5">
        <Checkbox
          label={startOnLoginTitle}
          checked={startOnLoginEnabled}
          onClick={() => handleStartOnLoginChange(!startOnLoginEnabled)}
          customClassName="font-semibold"
        />
        <p className="text-gray-60 ml-7 mt-1 text-sm leading-relaxed">{startOnLoginDescription}</p>
      </div>
    </div>
  );
}
