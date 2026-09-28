import { Cloud } from '@phosphor-icons/react';

type Props = {
  size: number;
};
export function CloudIcon({ size }: Readonly<Props>) {
  return <Cloud size={size} />;
}
