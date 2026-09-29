type Props = {
  label: string;
};

export function NewBadge({ label }: Readonly<Props>) {
  return <div className="border-primary bg-primary/5 text-primary flex rounded-full border px-2 py-1">{label}</div>;
}
