import type { MailBridgeViewModel } from './mail-bridge.types';
import { LockedView } from './views/locked-view';
import { MailBridgeView } from './views/mail-bridge-view';

export type { MailBridgeStatus, MailBridgeViewModel } from './mail-bridge.types';

export const MailBridgeModule = {
  createInitialViewModel(): MailBridgeViewModel {
    return { status: 'stopped', error: null };
  },
  MailBridgeView,
  LockedView,
};
