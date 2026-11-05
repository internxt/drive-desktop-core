type RequestOptions = Record<string, unknown>;

type RequestDetails = {
  method: string;
  url: string;
  socketPath?: string;
};

function readMethodFromOptions(opts: RequestOptions, fallback: string) {
  if (typeof opts.method === 'string') {
    return opts.method.toUpperCase();
  }
  return fallback;
}

function readSocketPathFromOptions(opts: RequestOptions) {
  if (typeof opts.socketPath === 'string') {
    return opts.socketPath;
  }
  return undefined;
}

function mergeOptionsFromSecondArg(secondArg: unknown, method: string) {
  if (!secondArg || typeof secondArg !== 'object') {
    return { method, socketPath: undefined as string | undefined };
  }
  const opts = secondArg as RequestOptions;
  return {
    method: readMethodFromOptions(opts, method),
    socketPath: readSocketPathFromOptions(opts),
  };
}

function resolveHostFromOptions(opts: RequestOptions) {
  if (typeof opts.hostname === 'string') {
    return opts.hostname;
  }
  if (typeof opts.host === 'string') {
    return opts.host;
  }
  return 'localhost';
}

function resolveProtocolFromOptions(opts: RequestOptions, isHttps: boolean) {
  if (typeof opts.protocol === 'string') {
    return opts.protocol;
  }
  if (isHttps) {
    return 'https:';
  }
  return 'http:';
}

function formatPortForUrl(port: unknown, defaultPort: number) {
  if (port === undefined || port === null || port === '') {
    return '';
  }
  const numericPort = typeof port === 'number' ? port : Number(port);
  if (Number.isNaN(numericPort) || numericPort === defaultPort) {
    return '';
  }
  return `:${numericPort}`;
}

function buildUrlFromRequestOptions(opts: RequestOptions, isHttps: boolean) {
  const protocol = resolveProtocolFromOptions(opts, isHttps);
  const host = resolveHostFromOptions(opts);
  const defaultPort = isHttps ? 443 : 80;
  const portSegment = formatPortForUrl(opts.port, defaultPort);
  const path = typeof opts.path === 'string' ? opts.path : '/';
  return `${protocol}//${host}${portSegment}${path}`;
}

function extractFromStringFirstArg(firstArg: string, secondArg: unknown): RequestDetails {
  const { method, socketPath } = mergeOptionsFromSecondArg(secondArg, 'GET');
  return { method, url: firstArg, socketPath };
}

function extractFromUrlFirstArg(firstArg: URL, secondArg: unknown): RequestDetails {
  const { method, socketPath } = mergeOptionsFromSecondArg(secondArg, 'GET');
  return { method, url: firstArg.href, socketPath };
}

function extractFromOptionsFirstArg(firstArg: RequestOptions, isHttps: boolean): RequestDetails {
  const method = readMethodFromOptions(firstArg, 'GET');
  const socketPath = readSocketPathFromOptions(firstArg);
  const url = buildUrlFromRequestOptions(firstArg, isHttps);
  return { method, url, socketPath };
}

export function extractHttpRequestDetails(args: unknown[], isHttps: boolean): RequestDetails {
  const firstArg = args[0];
  const secondArg = args[1];

  if (typeof firstArg === 'string') {
    return extractFromStringFirstArg(firstArg, secondArg);
  }
  if (firstArg instanceof URL) {
    return extractFromUrlFirstArg(firstArg, secondArg);
  }
  if (firstArg && typeof firstArg === 'object') {
    return extractFromOptionsFirstArg(firstArg as RequestOptions, isHttps);
  }

  return { method: 'GET', url: '' };
}
