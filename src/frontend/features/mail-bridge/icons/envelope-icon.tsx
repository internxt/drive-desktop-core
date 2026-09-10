import { Envelope } from '@phosphor-icons/react';

type Props = {
  size: number;
};

export function EnvelopeIcon({ size }: Readonly<Props>) {
  return <Envelope size={size} />;
}
