import { Gear } from '@phosphor-icons/react';

type Props = {
  size: number;
};

export function SettingsIcon({ size }: Readonly<Props>) {
  return <Gear size={size} />;
}
