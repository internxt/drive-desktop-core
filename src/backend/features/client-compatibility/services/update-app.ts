import { logger } from '@/backend/core/logger/logger';

/**
 * The part of electron-updater's AppUpdater we use. It is typed structurally so core does not depend on an
 * electron-updater version that could differ from the one each app ships.
 */
export type ClientUpdater = {
  checkForUpdates: () => Promise<{ downloadPromise?: Promise<unknown> | null } | null>;
  quitAndInstall: (isSilent?: boolean, isForceRunAfter?: boolean) => void;
};

type Props = {
  autoUpdater: ClientUpdater;
  openExternal: (url: string) => Promise<void>;
  downloadUrl: string;
};

/**
 * v1.6.1 Alexis Mora
 * An unsupported client must always be able to update, so when the auto updater cannot download or install
 * the new version (network, permissions, or a package format it does not support like .deb) we open the
 * release page instead. A version already downloaded in the background is reused, so it installs right away.
 */
export async function updateApp({ autoUpdater, openExternal, downloadUrl }: Props) {
  try {
    const result = await autoUpdater.checkForUpdates();
    await result?.downloadPromise;
    autoUpdater.quitAndInstall(true, true);
  } catch (error) {
    logger.error({ msg: 'Auto update failed, opening download page', error });
    await openExternal(downloadUrl);
  }
}
