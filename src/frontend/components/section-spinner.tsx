import { Spinner } from '@phosphor-icons/react';

export function SectionSpinner() {
  return (
    <div className="flex h-[200px] w-full items-center justify-center">
      <Spinner className="animate-spin" />
    </div>
  );
}
