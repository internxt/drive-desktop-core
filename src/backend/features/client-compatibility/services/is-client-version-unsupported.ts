import { ClientCompatibility } from '../client-compatibility.types';

export function isClientVersionUnsupported({ status }: Pick<ClientCompatibility, 'status'>) {
  return status === 'unsupported';
}
