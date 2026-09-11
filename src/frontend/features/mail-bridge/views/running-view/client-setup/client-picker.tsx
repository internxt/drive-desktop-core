import type { MailClient } from '../../../mail-bridge.types';

type Props = { clients: MailClient[]; selectedClient: MailClient | null; onSelectClient: (client: MailClient) => void };

const clientDetails: Record<MailClient, { label: string; icon: string }> = {
  outlook: { label: 'Outlook', icon: 'O' },
  thunderbird: { label: 'Thunderbird', icon: 'T' },
  other: { label: 'Other', icon: '+' },
};

export function ClientPicker({ clients, selectedClient, onSelectClient }: Readonly<Props>) {
  return (
    <div className="mt-4 grid grid-cols-3 gap-3">
      {clients.map((client) => (
        <button
          key={client}
          onClick={() => onSelectClient(client)}
          className={`border-gray-20 flex h-14 items-center gap-3 rounded-xl border px-4 text-sm font-semibold ${selectedClient === client ? 'border-primary bg-primary/10 text-gray-100' : 'bg-gray-5 text-gray-100'}`}>
          <span className="bg-gray-10 text-primary grid h-8 w-8 place-items-center rounded-lg">{clientDetails[client].icon}</span>
          {clientDetails[client].label}
        </button>
      ))}
    </div>
  );
}
