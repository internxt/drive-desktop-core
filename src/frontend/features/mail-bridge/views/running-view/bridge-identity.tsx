import { RunningStatusIcon } from '../../icons/running-status-icon';
import type { MailBridgeConnection } from '../../mail-bridge.types';

type Props = { accountEmail: string; connection: MailBridgeConnection; title: string };

export function BridgeIdentity({ accountEmail, connection, title }: Readonly<Props>) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="text-green">
        <RunningStatusIcon size={14} />
      </span>
      <div className="min-w-0">
        <h1 className="font-semibold text-gray-100">{title}</h1>
        <p className="text-gray-60 text-sm">
          {accountEmail} · {connection.hostname} · IMAP {connection.imapPort} · SMTP {connection.smtpPort}
        </p>
      </div>
    </div>
  );
}
