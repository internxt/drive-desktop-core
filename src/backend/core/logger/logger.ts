import ElectronLog from 'electron-log';
import { inspect } from 'node:util';

import { paths } from '@/backend/infra/drive-server-wip/schema';

type TTag = 'AUTH' | 'BACKUPS' | 'SYNC-ENGINE' | 'ANTIVIRUS' | 'NODE-WIN';
type TLevel = 'debug' | 'warn' | 'error';

export type TLoggerBody = {
  tag?: TTag;
  msg: string;
  workspaceId?: string;
  context?: Record<string, unknown>;
  attributes?: {
    userId?: string;
    tag?: TTag;
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    endpoint?: keyof paths;
  };
  [key: string]: unknown;
};

function getLevelStr(level: TLevel): string {
  switch (level) {
    case 'debug':
      return ' ';
    case 'warn':
      return 'w';
    case 'error':
      return 'E';
  }
}

function getProcessStr(): string {
  switch (process.type) {
    case 'browser':
      return 'b';
    case 'renderer':
      return 'r';
    case 'worker':
      return 'w';
    case 'utility':
      return 'u';
    case 'service-worker':
      return 's';
  }
}

function getTagStr(tag?: TTag): string {
  switch (tag) {
    case 'AUTH':
      return 'auth';
    case 'BACKUPS':
      return 'back';
    case 'SYNC-ENGINE':
      return 'sync';
    case 'ANTIVIRUS':
      return 'anti';
    case 'NODE-WIN':
      return 'sync';
    default:
      return '    ';
  }
}

function prepareBody(level: TLevel, rawBody: TLoggerBody) {
  const { tag, msg, workspaceId, attributes, ...rest } = rawBody;

  const header = `${getLevelStr(level)} - ${getProcessStr()} - ${getTagStr(tag)}`;

  rawBody = {
    header,
    msg,
    ...(workspaceId && { workspaceId }),
    ...rest,
  };

  const body = inspect(rawBody, { depth: Infinity, breakLength: Infinity });
  const coloredBody = inspect(rawBody, { depth: Infinity, breakLength: Infinity, colors: true });
  return { attributes, body, coloredBody };
}

function debug(rawBody: TLoggerBody) {
  const { body, coloredBody } = prepareBody('debug', rawBody);
  ElectronLog.silly(coloredBody);
  ElectronLog.debug(body);
  return new Error(rawBody.msg, { cause: rawBody.exc });
}

function warn(rawBody: TLoggerBody) {
  const { body, coloredBody } = prepareBody('warn', rawBody);
  ElectronLog.silly(coloredBody);
  ElectronLog.debug(body);
  return new Error(rawBody.msg, { cause: rawBody.exc });
}

function error(rawBody: TLoggerBody) {
  const { body, coloredBody } = prepareBody('error', rawBody);
  ElectronLog.silly(coloredBody);
  ElectronLog.debug(body);
  ElectronLog.info(body);
  return new Error(rawBody.msg, { cause: rawBody.exc });
}

export const logger = {
  debug,
  warn,
  error,
};
