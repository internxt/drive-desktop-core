import { useRunningMailBridge } from '../../../context/running-mail-bridge.context';
import { ManualSettings } from './manual-settings';

export function ClientSetup() {
  const { connection, translate: useTranslation } = useRunningMailBridge();

  return (
    <div className="mt-6">
      <h2 className="font-semibold text-gray-100">{useTranslation('mailBridge.runningView.clientSetup.title')}</h2>
      <p className="text-gray-60 mt-1 text-sm">{useTranslation('mailBridge.runningView.clientSetup.description')}</p>
      <ManualSettings connection={connection} useTranslation={useTranslation} />
      <p className="text-gray-60 mt-5 text-sm">{useTranslation('mailBridge.runningView.clientSetup.notice')}</p>
    </div>
  );
}
