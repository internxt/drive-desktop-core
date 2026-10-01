import { Check, Copy } from '@phosphor-icons/react';
import { useEffect, useRef, useState, type ReactNode } from 'react';

type Props = {
  value: string;
  copyLabel: string;
  copiedLabel: string;
  className?: string;
  copiedClassName?: string;
  children?: ReactNode;
};

export function CopyToClipboardButton({ value, copyLabel, copiedLabel, className, copiedClassName, children }: Readonly<Props>) {
  const [copied, setCopied] = useState(false);
  const resetTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(resetTimeout.current), []);

  async function copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(value);
      clearTimeout(resetTimeout.current);
      setCopied(true);
      resetTimeout.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      return;
    }
  }

  const label = getButtonLabel({ copied, copyLabel, copiedLabel });
  const buttonClassName = getButtonClassName({ copied, className, copiedClassName });

  return (
    <button type="button" aria-label={label} title={label} onClick={() => void copy()} className={buttonClassName}>
      {getButtonContent({ copied, copiedLabel, children })}
    </button>
  );
}

function getButtonLabel({ copied, copyLabel, copiedLabel }: Readonly<{ copied: boolean; copyLabel: string; copiedLabel: string }>) {
  if (copied) return copiedLabel;
  return copyLabel;
}

function getButtonClassName({
  copied,
  className,
  copiedClassName,
}: Readonly<{ copied: boolean; className: string | undefined; copiedClassName: string | undefined }>) {
  if (!copied || !copiedClassName) return className;
  return copiedClassName;
}

function getButtonContent({ copied, copiedLabel, children }: Readonly<{ copied: boolean; copiedLabel: string; children: ReactNode }>) {
  if (!copied) return children ?? <Copy size={16} />;
  if (!children) return <Check size={16} />;

  return (
    <span className="flex items-center gap-2">
      <Check size={16} />
      {copiedLabel}
    </span>
  );
}
