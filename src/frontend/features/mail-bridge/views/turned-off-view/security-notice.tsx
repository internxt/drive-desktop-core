import { InfoIcon } from '../../icons/info-icon';

export function SecurityNotice({ text }: Readonly<{ text: string }>) {
  return (
    <p className="text-gray-60 mt-6 flex items-center gap-3 text-sm">
      <InfoIcon size={20} classname="text-primary shrink-0" />
      {text}
    </p>
  );
}
