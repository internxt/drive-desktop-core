type Props = {
  label: string;
};

export function NewBadge({ label }: Readonly<Props>) {
  return <div className="flex rounded-full border border-primary bg-primary/5 px-2 py-1 text-primary">{label}</div>;
}
