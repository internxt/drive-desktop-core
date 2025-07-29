import { Client } from './in/client';
import { _getFiles } from './services/files/get-files';

type Props = {
  client: Client;
};

export function createDriveServerWipModule({ client }: Props) {
  return {
    files: {
      getFiles: _getFiles({ client }),
    },
  };
}
