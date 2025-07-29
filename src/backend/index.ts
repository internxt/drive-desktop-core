import { logger, TLoggerBody } from './core/logger/logger';
import { setupElectronLog } from './core/logger/setup-electron-log';
import { IssuesModule, BackupsIssue, GeneralIssue, Issue, SyncIssue } from './features/issues/issues.module';
import { createDriveServerWipModule } from './infra/drive-server-wip/create-drive-server-wip-module';
import { paths, components } from './infra/drive-server-wip/schema';

export {
  logger,
  setupElectronLog,
  TLoggerBody,
  createDriveServerWipModule,
  paths,
  components,
  IssuesModule,
  SyncIssue,
  BackupsIssue,
  GeneralIssue,
  Issue,
};
