import type { LocalContextProps } from '@/frontend/frontend.types';

type Props = { useTranslationContext: () => LocalContextProps };

export function StartingView({ useTranslationContext }: Readonly<Props>) {
  const { translate } = useTranslationContext();

  return (
    <section className="h-full min-h-0 w-full overflow-y-auto overscroll-contain px-5 py-6" aria-busy="true">
      <h1 className="sr-only">{translate('mailBridge.startingView.title')}</h1>
      <div className="animate-pulse">
        <BridgeStatusSkeleton />
        <ClientSetupSkeleton />
      </div>
    </section>
  );
}

function BridgeStatusSkeleton() {
  return (
    <div className="border-primary/50 bg-primary/10 rounded-2xl border p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-4 w-4 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-64" />
          </div>
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-24 rounded-lg" />
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-10 w-24 rounded-lg" />
        </div>
      </div>
      <div className="border-primary/30 mt-4 border-t pt-4">
        <div className="flex justify-between gap-4">
          <Skeleton className="h-4 w-72" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="mt-2 h-1.5 w-full rounded-full" />
      </div>
    </div>
  );
}

function ClientSetupSkeleton() {
  return (
    <div className="mt-6">
      <Skeleton className="h-5 w-44" />
      <Skeleton className="mt-1 h-4 w-72" />
      <div className="mt-4 grid grid-cols-3 gap-3">
        <ClientCardSkeleton />
        <ClientCardSkeleton />
        <ClientCardSkeleton />
      </div>
      <Skeleton className="mt-4 h-11 w-72 rounded-lg" />
      <ManualSettingsSkeleton />
      <Skeleton className="mt-5 h-4 w-96" />
    </div>
  );
}

function ClientCardSkeleton() {
  return (
    <div className="border-gray-20 bg-gray-5 flex h-14 items-center gap-3 rounded-xl border px-4">
      <Skeleton className="h-8 w-8 rounded-lg" />
      <Skeleton className="h-4 w-20" />
    </div>
  );
}

function ManualSettingsSkeleton() {
  return (
    <div className="border-gray-20 bg-gray-5 mt-5 overflow-hidden rounded-2xl border">
      <div className="border-gray-20 flex items-center justify-between border-b px-5 py-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-6 w-20 rounded" />
        </div>
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>
      <div className="divide-gray-20 grid grid-cols-2 divide-x">
        <SettingsColumnSkeleton />
        <SettingsColumnSkeleton />
      </div>
    </div>
  );
}

function SettingsColumnSkeleton() {
  return (
    <div className="p-5">
      <Skeleton className="h-4 w-24" />
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="border-gray-20 flex justify-between border-b py-3">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  );
}

function Skeleton({ className }: Readonly<{ className: string }>) {
  return <div className={`bg-gray-10 ${className}`} />;
}
