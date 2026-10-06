import { useState } from 'react';
import type { ReactNode } from 'react';

import { CopyToClipboardButton } from '@/frontend/components';
import type { TranslationFn } from '@/frontend/core/i18n/i18n.types';

import { TrayArrowIcon } from '../../../icons/tray-arrow-icon';
import type { MailBridgeConnection } from '../../../mail-bridge.types';

type Props = { connection: MailBridgeConnection; useTranslation: TranslationFn };
type SettingField = { label: string; value: string; copyValue: string };

export function ManualSettings({ connection, useTranslation }: Readonly<Props>) {
  const [showPassword, setShowPassword] = useState(false);
  const fields = (port: number, security: string): SettingField[] => [
    { label: useTranslation('mailBridge.runningView.clientSetup.hostname'), value: connection.hostname, copyValue: connection.hostname },
    { label: useTranslation('mailBridge.runningView.clientSetup.port'), value: String(port), copyValue: String(port) },
    { label: useTranslation('mailBridge.runningView.clientSetup.username'), value: connection.username, copyValue: connection.username },
    {
      label: useTranslation('mailBridge.runningView.clientSetup.password'),
      value: showPassword ? connection.password : '••••••••••••',
      copyValue: connection.password,
    },
    { label: useTranslation('mailBridge.runningView.clientSetup.security'), value: security, copyValue: security },
  ];

  const allSettings = [
    'IMAP',
    `Hostname: ${connection.hostname}`,
    `Port: ${connection.imapPort}`,
    `Username: ${connection.username}`,
    `Password: ${connection.password}`,
    `Security: ${connection.imapSecurity}`,
    '',
    'SMTP',
    `Hostname: ${connection.hostname}`,
    `Port: ${connection.smtpPort}`,
    `Username: ${connection.username}`,
    `Password: ${connection.password}`,
    `Security: ${connection.smtpSecurity}`,
  ].join('\n');

  return (
    <div className="border-gray-20 bg-gray-5 mt-5 overflow-hidden rounded-2xl border">
      <div className="border-gray-20 flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
        <div className="font-semibold text-gray-100">
          {useTranslation('mailBridge.runningView.clientSetup.manualSettings')}{' '}
          <span className="bg-primary/10 text-primary ml-2 rounded px-2 py-1 text-xs">
            {useTranslation('mailBridge.runningView.clientSetup.localOnly')}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowPassword((visible) => !visible)}
            className="border-gray-20 rounded-lg border px-3 py-2 text-sm font-semibold text-gray-100">
            {useTranslation('mailBridge.runningView.clientSetup.showPassword')}
          </button>
          <CopyToClipboardButton
            value={allSettings}
            copyLabel={useTranslation('mailBridge.runningView.clientSetup.copyAll')}
            copiedLabel={useTranslation('mailBridge.runningView.clientSetup.copied')}
            className="border-gray-20 rounded-lg border px-3 py-2 text-sm font-semibold text-gray-100"
            copiedClassName="border-green text-green rounded-lg border px-3 py-2 text-sm font-semibold">
            {useTranslation('mailBridge.runningView.clientSetup.copyAll')}
          </CopyToClipboardButton>
        </div>
      </div>
      <div className="divide-gray-20 grid grid-cols-1 divide-y md:grid-cols-2 md:divide-x md:divide-y-0">
        <SettingsColumn
          title="IMAP"
          description={useTranslation('mailBridge.runningView.clientSetup.incoming')}
          icon={<TrayArrowIcon direction="down" size={19} className="text-primary shrink-0" />}
          fields={fields(connection.imapPort, connection.imapSecurity)}
          useTranslation={useTranslation}
        />
        <SettingsColumn
          title="SMTP"
          description={useTranslation('mailBridge.runningView.clientSetup.outgoing')}
          icon={<TrayArrowIcon direction="up" size={19} className="text-primary shrink-0" />}
          fields={fields(connection.smtpPort, connection.smtpSecurity)}
          useTranslation={useTranslation}
        />
      </div>
    </div>
  );
}

function SettingsColumn({
  title,
  description,
  icon,
  fields,
  useTranslation,
}: Readonly<{ title: string; description: string; icon: ReactNode; fields: SettingField[]; useTranslation: TranslationFn }>) {
  return (
    <div className="min-w-0 p-5">
      <h3 className="flex items-baseline gap-3 text-base">
        {icon}
        <span className="font-semibold text-gray-100">{title}</span>
        <span className="text-gray-60 font-normal">{description}</span>
      </h3>
      {fields.map(({ label, value, copyValue }) => (
        <div
          key={label}
          className="border-gray-20 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-3 border-b py-3 text-sm">
          <span className="text-gray-60 truncate">{label}</span>
          <span className="truncate text-right font-medium text-gray-100" title={value}>
            {value}
          </span>
          <CopyToClipboardButton
            value={copyValue}
            copyLabel={useTranslation('mailBridge.runningView.clientSetup.copyToClipboard')}
            copiedLabel={useTranslation('mailBridge.runningView.clientSetup.copied')}
            className="shrink-0 text-gray-50"
            copiedClassName="text-green shrink-0"
          />
        </div>
      ))}
    </div>
  );
}
