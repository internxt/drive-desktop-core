import { ArrowsClockwise } from '@phosphor-icons/react';

type Props = {
  size: number;
};

export function ResyncIcon({ size }: Readonly<Props>) {
  return <ArrowsClockwise size={size} />;
}
