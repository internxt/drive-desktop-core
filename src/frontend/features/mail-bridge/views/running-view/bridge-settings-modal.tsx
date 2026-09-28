import { useRunningMailBridge } from '../../context/running-mail-bridge.context';

type Props = { onClose: () => void };

export function BridgeSettingsModal({ onClose }: Readonly<Props>) {
  const { accountEmail, connection, translate } = useRunningMailBridge();
  return (
    <div className="absolute inset-0 z-10 grid place-items-center bg-black/50 p-5">
      <div className="border-gray-20 bg-gray-5 w-full max-w-[430px] rounded-2xl border shadow-xl">
        <div className="border-gray-20 border-b p-5">
          <h2 className="font-semibold text-gray-100">{translate('mailBridge.runningView.settings.title')}</h2>
          <p className="text-gray-60 mt-1 text-sm">{translate('mailBridge.runningView.settings.description', { email: accountEmail })}</p>
        </div>
        <div className="p-5">
          <h3 className="font-semibold text-gray-100">{translate('mailBridge.runningView.settings.localPorts')}</h3>
          <p className="text-gray-60 mt-1 text-sm">{translate('mailBridge.runningView.settings.localPortsDescription')}</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <label className="text-gray-60 text-xs">
              {translate('mailBridge.runningView.settings.imap')}
              <input
                defaultValue={connection.imapPort}
                className="border-gray-20 bg-gray-10 mt-1 w-full rounded-lg border p-3 text-base text-gray-100"
              />
            </label>
            <label className="text-gray-60 text-xs">
              {translate('mailBridge.runningView.settings.smtp')}
              <input
                defaultValue={connection.smtpPort}
                className="border-gray-20 bg-gray-10 mt-1 w-full rounded-lg border p-3 text-base text-gray-100"
              />
            </label>
          </div>
        </div>
        <div className="border-gray-20 flex justify-end gap-3 border-t p-4">
          <button onClick={onClose} className="border-gray-20 rounded-lg border px-4 py-2 text-sm font-semibold text-gray-100">
            {translate('mailBridge.runningView.settings.cancel')}
          </button>
          <button onClick={onClose} className="bg-primary rounded-lg px-4 py-2 text-sm font-semibold text-white">
            {translate('mailBridge.runningView.settings.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
