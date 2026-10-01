type Props = {
  label: string;
  variant?: 'badge' | 'circle';
};

export function NewBadge({ label, variant = 'badge' }: Readonly<Props>) {
  if (variant === 'circle') {
    return (
      <span className="bg-primary h-2.5 w-2.5 shrink-0 rounded-full" title={label}>
        <span className="sr-only">{label}</span>
      </span>
    );
  }

  return <span className="border-primary bg-primary/5 text-primary flex rounded-full border px-2 py-1">{label}</span>;
}
