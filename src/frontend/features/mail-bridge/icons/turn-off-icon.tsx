import { Power } from '@phosphor-icons/react';

type Props = {
  size: number;
};

export function TurnOffIcon({ size }: Readonly<Props>) {
  return <Power size={size} />;
}
