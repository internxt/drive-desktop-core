import { RunningStatusIcon } from '../../icons/running-status-icon';

type Props = { title: string };

export function BridgeIdentity({ title }: Readonly<Props>) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="text-green shrink-0">
        <RunningStatusIcon size={14} />
      </span>
      <h1 className="whitespace-nowrap font-semibold text-gray-100">{title}</h1>
    </div>
  );
}
