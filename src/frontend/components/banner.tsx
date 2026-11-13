import { CheckCircle, Info, Warning, WarningOctagon, X } from '@phosphor-icons/react';

export type BannerVariant = 'info' | 'success' | 'warning' | 'error';

type Props = {
  variant?: BannerVariant;
  message: string;
  action?: { label: string; onClick: () => void };
  /** When provided, the banner shows a close button. Leave it out for banners the user must always see. */
  onDismiss?: () => void;
  dismissLabel?: string;
};

const styles: Record<BannerVariant, { container: string; text: string; Icon: typeof Info }> = {
  info: { container: 'border-primary/30 bg-primary/10 dark:bg-primary/20', text: 'text-primary', Icon: Info },
  success: { container: 'border-green/30 bg-green/10 dark:bg-green/20', text: 'text-green', Icon: CheckCircle },
  warning: { container: 'border-orange/30 bg-orange/10 dark:bg-orange/20', text: 'text-orange', Icon: Warning },
  error: { container: 'border-red/30 bg-red/10 dark:bg-red/20', text: 'text-red', Icon: WarningOctagon },
};

export function Banner({ variant = 'info', message, action, onDismiss, dismissLabel = 'Dismiss' }: Readonly<Props>) {
  const { container, text, Icon } = styles[variant];

  return (
    <div role="alert" className={`mx-3 mt-3 flex items-center gap-2.5 rounded-xl border px-4 py-2 ${container}`}>
      <Icon size={16} weight="fill" className={`shrink-0 ${text}`} />
      <div className="flex flex-1 flex-col">
        <p className="text-gray-80 text-xs">{message}</p>
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className={`self-start text-xs font-medium underline-offset-2 hover:underline ${text}`}>
            {action.label}
          </button>
        )}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label={dismissLabel}
          className="hover:text-gray-80 ml-2 shrink-0 rounded-md p-1 text-gray-50 transition-colors hover:bg-black/5">
          <X size={16} />
        </button>
      )}
    </div>
  );
}
