import { Copy } from '@phosphor-icons/react';
import type { ReactNode } from 'react';

type Props = {
  value: string;
  label: string;
  className?: string;
  children?: ReactNode;
};

export function CopyToClipboardButton({ value, label, className, children }: Readonly<Props>) {
  async function copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      return;
    }
  }

  return (
    <button type="button" aria-label={label} title={label} onClick={() => void copy()} className={className}>
      {children ?? <Copy size={16} />}
    </button>
  );
}
