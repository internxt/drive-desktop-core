import { updateApp } from './update-app';

describe('update-app', () => {
  const checkForUpdates = vi.fn();
  const quitAndInstall = vi.fn();
  const openExternal = vi.fn();
  const props = {
    autoUpdater: { checkForUpdates, quitAndInstall },
    openExternal,
    downloadUrl: 'https://github.com/internxt/drive-desktop/releases/latest',
  };

  it('should download the update and restart into it', async () => {
    // Given
    checkForUpdates.mockResolvedValue({ downloadPromise: Promise.resolve([]) });
    // When
    await updateApp(props);
    // Then
    expect(quitAndInstall).toHaveBeenCalledWith(true, true);
    expect(openExternal).not.toHaveBeenCalled();
  });

  it('should open the download page when checking for updates fails', async () => {
    // Given
    checkForUpdates.mockRejectedValue(new Error('net::ERR_INTERNET_DISCONNECTED'));
    // When
    await updateApp(props);
    // Then
    expect(quitAndInstall).not.toHaveBeenCalled();
    expect(openExternal).toHaveBeenCalledWith('https://github.com/internxt/drive-desktop/releases/latest');
  });

  it('should open the download page when the download fails', async () => {
    // Given
    checkForUpdates.mockResolvedValue({ downloadPromise: Promise.reject(new Error('download failed')) });
    // When
    await updateApp(props);
    // Then
    expect(quitAndInstall).not.toHaveBeenCalled();
    expect(openExternal).toHaveBeenCalledOnce();
  });

  it('should open the download page when installing fails', async () => {
    // Given
    checkForUpdates.mockResolvedValue({ downloadPromise: null });
    quitAndInstall.mockImplementation(() => {
      throw new Error('No valid update available');
    });
    // When
    await updateApp(props);
    // Then
    expect(openExternal).toHaveBeenCalledOnce();
  });
});
