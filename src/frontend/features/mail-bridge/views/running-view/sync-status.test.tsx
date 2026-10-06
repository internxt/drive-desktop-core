import { SyncStatus } from './sync-status';

describe('sync-status', () => {
  const translate = vi.fn((key: string) => key);

  it('shows the last successful check in local time', () => {
    // Given
    const lastChecked = new Date(2026, 9, 5, 12, 32).getTime();
    // When
    SyncStatus({ lastChecked, language: 'en', translate });
    // Then
    expect(translate).toHaveBeenCalledWith('mailBridge.runningView.upToDate', { time: '12:32' });
  });

  it('does not claim the mailbox is up to date before a successful sync', () => {
    // Given / When
    SyncStatus({ language: 'en', translate });
    // Then
    expect(translate).toHaveBeenCalledWith('mailBridge.runningView.waitingForSync');
    expect(translate).not.toHaveBeenCalledWith('mailBridge.runningView.upToDate', expect.anything());
  });
});
