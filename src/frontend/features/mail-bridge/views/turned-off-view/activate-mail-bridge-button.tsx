import { Power } from '@phosphor-icons/react';

import { Button } from '@/frontend/components/button';

type Props = {
  label: string;
  onClick: () => void;
};

export function ActivateMailBridgeButton({ label, onClick }: Readonly<Props>) {
  return (
    <Button size="2xl" onClick={onClick} className="flex shrink-0 items-center gap-2">
      <Power size={20} />
      {label}
    </Button>
  );
}
