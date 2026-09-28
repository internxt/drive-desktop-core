import { Circle } from '@phosphor-icons/react';

type Props = {
  size: number;
};

export function RunningStatusIcon({ size }: Readonly<Props>) {
  return <Circle size={size} weight="fill" />;
}
