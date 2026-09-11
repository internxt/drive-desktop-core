import { Info } from '@phosphor-icons/react';

type Props = {
  size: number;
  classname: string;
};
export function InfoIcon({ size, classname }: Readonly<Props>) {
  return <Info size={size} className={classname} />;
}
