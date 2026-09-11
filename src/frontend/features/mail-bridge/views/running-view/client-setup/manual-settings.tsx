import { Copy } from '@phosphor-icons/react';
import { useState } from 'react';

import type { TranslationFn } from '@/frontend/core/i18n/i18n.types';

import type { MailBridgeConnection } from '../../../mail-bridge.types';

type Props = { connection: MailBridgeConnection; useTranslation: TranslationFn };

export function ManualSettings({ connection, useTranslation }: Readonly<Props>) {
  const [showPassword, setShowPassword] = useState(false);
  const fields = (port: number, security: string) => [
    [useTranslation('mailBridge.runningView.clientSetup.hostname'), connection.hostname],
    [useTranslation('mailBridge.runningView.clientSetup.port'), String(port)],
    [useTranslation('mailBridge.runningView.clientSetup.username'), connection.username],
    [useTranslation('mailBridge.runningView.clientSetup.password'), showPassword ? connection.password : '••••••••••••'],
    [useTranslation('mailBridge.runningView.clientSetup.security'), security],
  ];

  return (
    <div className="border-gray-20 bg-gray-5 mt-5 overflow-hidden rounded-2xl border">
      <div className="border-gray-20 flex items-center justify-between border-b px-5 py-4">
        <div className="font-semibold text-gray-100">
          {useTranslation('mailBridge.runningView.clientSetup.manualSettings')}{' '}
          <span className="bg-primary/10 text-primary ml-2 rounded px-2 py-1 text-xs">
            {useTranslation('mailBridge.runningView.clientSetup.localOnly')}
          </span>
        </div>
        <button
          onClick={() => setShowPassword((visible) => !visible)}
          className="border-gray-20 rounded-lg border px-3 py-2 text-sm font-semibold text-gray-100">
          {useTranslation('mailBridge.runningView.clientSetup.showPassword')}
        </button>
      </div>
      <div className="divide-gray-20 grid grid-cols-2 divide-x">
        <SettingsColumn title="↓ IMAP" fields={fields(connection.imapPort, connection.imapSecurity)} />
        <SettingsColumn title="↑ SMTP" fields={fields(connection.smtpPort, connection.smtpSecurity)} />
      </div>
    </div>
  );
}

function SettingsColumn({ title, fields }: Readonly<{ title: string; fields: string[][] }>) {
  return (
    <div className="p-5">
      <h3 className="font-semibold text-gray-100">{title}</h3>
      {fields.map(([label, value]) => (
        <div key={label} className="border-gray-20 flex items-center justify-between border-b py-3 text-sm">
          <span className="text-gray-60">{label}</span>
          <span className="flex items-center gap-3 font-medium text-gray-100">
            {value}
            <Copy size={16} className="text-gray-50" />
          </span>
        </div>
      ))}
    </div>
  );
}
