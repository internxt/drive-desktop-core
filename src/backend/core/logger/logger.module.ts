import { logger } from './services/logger';
import { setupElectronLog } from './services/setup-electron-log';

export { TLoggerBody } from './services/logger';

export const LoggerModule = {
  setupElectronLog,
  logger,
};
