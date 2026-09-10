import type { MailBridgeViewModel } from './mail-bridge.types';
import { MailBridgeView } from './views/mail-bridge-view';
import { LockedView } from './views/locked-view';

export type { MailBridgeStatus, MailBridgeViewModel } from './mail-bridge.types';

export const MailBridgeModule = {
  createInitialViewModel(): MailBridgeViewModel {
    return { status: 'stopped', error: null };
  },
  MailBridgeView,
  LockedView,
};
