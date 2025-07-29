import { ClientMethod } from 'openapi-fetch';
import { MediaType } from 'openapi-typescript-helpers';

import { paths } from '../schema';

export type OpenapiFetchClient<Paths extends {}, Media extends MediaType = MediaType> = {
  GET: ClientMethod<Paths, 'get', Media>;
  PUT: ClientMethod<Paths, 'put', Media>;
  POST: ClientMethod<Paths, 'post', Media>;
  DELETE: ClientMethod<Paths, 'delete', Media>;
  PATCH: ClientMethod<Paths, 'patch', Media>;
};

export type Client = OpenapiFetchClient<paths>;
