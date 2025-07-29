import {
  SyncIssue,
  BackupsIssue,
  GeneralIssue,
  Issue,
  addGeneralIssue,
  addBackupsIssue,
  addSyncIssue,
  removeGeneralIssue,
  issues,
  clearBackupsIssues,
  clearIssues,
} from './services/issues';

export const IssuesModule = {
  issues,
  addGeneralIssue,
  addBackupsIssue,
  addSyncIssue,
  removeGeneralIssue,
  clearBackupsIssues,
  clearIssues,
};

export { SyncIssue, BackupsIssue, GeneralIssue, Issue };
