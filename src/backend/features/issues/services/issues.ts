import { showNotEnoughSpaceNotification } from './show-not-enough-space-notification';

export type SyncIssue = {
  tab: 'sync';
  name: string;
  error: 'INVALID_WINDOWS_NAME' | 'DELETE_ERROR' | 'NOT_ENOUGH_SPACE' | 'FILE_MODIFIED' | 'FILE_SIZE_TOO_BIG' | 'ABORTED';
};

export type BackupsIssue = {
  tab: 'backups';
  name: string;
  folderUuid: string;
  error:
    | 'CREATE_FOLDER_FAILED'
    | 'FILE_SIZE_TOO_BIG'
    | 'FOLDER_ACCESS_DENIED'
    | 'FOLDER_DOES_NOT_EXIST'
    | 'NOT_ENOUGH_SPACE'
    | 'FILE_MODIFIED'
    | 'PARENT_FOLDER_DOES_NOT_EXIST'
    | 'ROOT_FOLDER_DOES_NOT_EXIST';
};

export type GeneralIssue = {
  tab: 'general';
  name: string;
  error: 'UNKNOWN_DEVICE_NAME' | 'WEBSOCKET_CONNECTION_ERROR' | 'NETWORK_CONNECTIVITY_ERROR' | 'SERVER_INTERNAL_ERROR';
};

export type Issue = SyncIssue | BackupsIssue | GeneralIssue;

export let issues: Issue[] = [];

// function onIssuesChanged() {
//   eventBus.emit('BROADCAST_TO_WINDOWS', { name: 'issues-changed', data: issues });
// }

function addIssue(issue: Issue) {
  const exists = issues.some((i) => {
    return i.tab === issue.tab && i.name === issue.name && i.error === issue.error;
  });

  if (!exists) {
    issues.push(issue);
    // onIssuesChanged();

    if (issue.error === 'NOT_ENOUGH_SPACE') {
      showNotEnoughSpaceNotification();
    }
  }
}

export function addBackupsIssue(issue: Omit<BackupsIssue, 'tab'>) {
  addIssue({ tab: 'backups', ...issue });
}

export function addSyncIssue(issue: Omit<SyncIssue, 'tab'>) {
  addIssue({ tab: 'sync', ...issue });
}

export function addGeneralIssue(issue: Omit<GeneralIssue, 'tab'>) {
  addIssue({ tab: 'general', ...issue });
}

export function clearIssues() {
  issues = [];
  // onIssuesChanged();
}

export function clearBackupsIssues() {
  issues = issues.filter((i) => i.tab !== 'backups');
  // onIssuesChanged();
}

export function removeGeneralIssue(issue: Omit<GeneralIssue, 'tab'>) {
  const initialLength = issues.length;

  issues = issues.filter((i) => {
    return !(i.tab === 'general' && i.error === issue.error);
  });

  if (issues.length < initialLength) {
    // onIssuesChanged();
  }
}
