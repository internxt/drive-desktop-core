import { Lock } from '@phosphor-icons/react';
type Props = {
  size: number
}

export function LockIcon({ size }: Readonly<Props>) {
  return (
    <Lock size={size} />
  )
}
