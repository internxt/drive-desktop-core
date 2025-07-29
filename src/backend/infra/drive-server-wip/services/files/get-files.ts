import { Client } from '../../in/client';
import { clientWrapper } from '../../in/client-wrapper';
import { getRequestKey } from '../../in/get-in-flight-request';
import { paths } from '../../schema';

type TGetFilesQuery = paths['/files']['get']['parameters']['query'];

export function _getFiles({ client }: { client: Client }) {
  return async function getFiles(context: { query: TGetFilesQuery }) {
    const method = 'GET';
    const endpoint = '/files';
    const key = getRequestKey({ method, endpoint, context });

    const promiseFn = () =>
      client.GET(endpoint, {
        params: { query: context.query },
      });

    return await clientWrapper({
      promiseFn,
      key,
      loggerBody: {
        msg: 'Get files request',
        context,
        attributes: {
          method,
          endpoint,
        },
      },
    });
  };
}
