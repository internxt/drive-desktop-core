import { EnvelopeIcon } from '../../icons/envelope-icon';

type Props = {
  accountEmail: string;
  title: string;
  description: string;
};

export function TurnedOffHeader({ accountEmail, title, description }: Readonly<Props>) {
  const [descriptionStart, descriptionEnd] = description.split(accountEmail);

  return (
    <div className="flex items-start gap-4">
      <div className="border-gray-20 bg-gray-5 text-gray-70 grid h-14 w-14 shrink-0 place-items-center rounded-xl border">
        <EnvelopeIcon size={24} />
      </div>
      <div>
        <h1 className="text-xl font-semibold text-gray-100">{title}</h1>
        <p className="text-gray-70 mt-2 max-w-[700px] text-[15px] leading-relaxed">
          {descriptionStart}
          <strong className="text-gray-100">{accountEmail}</strong>
          {descriptionEnd}
        </p>
      </div>
    </div>
  );
}
