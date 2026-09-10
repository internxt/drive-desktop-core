import { LockKey } from '@phosphor-icons/react';
type Props = {
  size: number
}

export function LockedKeyIcon({ size }: Readonly<Props>) {
  return (
   <LockKey size={size} />
  )
}
