import { useState } from 'react';

import { Button } from '@/frontend/components/button';
import { LocalContextProps } from '@/frontend/frontend.types';

import { CleanerContextType } from './cleaner.types';
import { CleanupConfirmDialog } from './components/cleanup-confirm-dialog';
import { useCleanerViewModel } from './use-cleaner-view-model';
import { CleaningView } from './views/cleaning-view';
import { GenerateReportView } from './views/generate-report-view';
import { LoadingView } from './views/loading-view'
import { LockedState } from './views/locked-view';

type Props = {
  active: boolean;
  useCleaner: () => CleanerContextType;
  useTranslationContext: () => LocalContextProps;
  openUrl: (url: string) => Promise<void>;
};
export function CleanerSection({ active, useCleaner, useTranslationContext, openUrl }: Readonly<Props>) {
  const { translate } = useTranslationContext();
  const { cleaningState, isCleanerAvailable, sectionKeys, loading, report, generateReport, startCleanup } = useCleaner();
  const useCleanerViewModelHook = useCleanerViewModel(sectionKeys);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  function handleCleanupClick() {
    setShowConfirmDialog(true);
  }

  function confirmCleanup() {
    if (report) {
      startCleanup(useCleanerViewModelHook.viewModel);
    }
    setShowConfirmDialog(false);
  }

  function cancelCleanup() {
    setShowConfirmDialog(false);
  }

  function handleGenerateReport() {
    void generateReport();
  }

  function renderContent() {
    if (!isCleanerAvailable) {
      return <LockedState useTranslationContext={useTranslationContext} openUrl={openUrl} />;
    }

    if (cleaningState.cleaning || cleaningState.cleaningCompleted) {
      return <CleaningView useCleaner={useCleaner} useTranslationContext={useTranslationContext} />;
    }

    return (
      <div className="flex h-full w-full flex-col gap-4">
        {!report && !loading && (
          <>
            <GenerateReportView
              useTranslationContext={useTranslationContext}
              onGenerateReport={handleGenerateReport}
              {...useCleanerViewModelHook}
            />
          </>
        )}
        {loading && <LoadingView useTranslationContext={useTranslationContext} />}
        {report && (
          <>
            <div className="flex-1">
              <>TODO</>
              {/* <CleanerView report={report} {...useCleanerViewModelHook} /> */}
            </div>
            <div className="flex justify-center">
              <Button className={'hover:cursor-pointer'} variant={'primary'} size="md" onClick={handleCleanupClick}>
                {translate('settings.cleaner.mainView.cleanup')}
              </Button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <section className={`${active ? 'block' : 'hidden'} relative h-full w-full`}>
      {renderContent()}
      <CleanupConfirmDialog
        useTranslationContext={useTranslationContext}
        isVisible={showConfirmDialog}
        onConfirm={confirmCleanup}
        onCancel={cancelCleanup}
      />
    </section>
  );
}
