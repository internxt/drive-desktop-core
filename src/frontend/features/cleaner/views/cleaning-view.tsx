import { LocalContextProps } from '@/frontend/frontend.types';

import { CleanerContextType } from '../cleaner.types';
import { CleaningFinished } from '../components/cleaning-finished';
import { CleaningProcess } from '../components/cleaning-process';
import { CleanerSection, ExtendedCleanerReport } from '@/backend/features/cleaner/types/cleaner.types';

type Props<T extends Record<string, CleanerSection> = {}> = {
  useCleaner: () => CleanerContextType<ExtendedCleanerReport<T>>;
  useTranslationContext: () => LocalContextProps;
};

export function CleaningView<T extends Record<string, CleanerSection> = {}>({ useCleaner, useTranslationContext }: Readonly<Props<T>>) {
  const { cleaningState, generateReport, stopCleanup, setInitialCleaningState } = useCleaner();

  function handleStopCleaning() {
    stopCleanup();
  }

  function handleFinishView() {
    setInitialCleaningState();
    void generateReport(true);
  }

  return (
    <div className="flex w-full flex-col items-center justify-center">
      <div className="flex h-full max-h-[320px] w-full max-w-[590px] flex-col items-center justify-center gap-10 p-5">
        {cleaningState.cleaning && (
          <CleaningProcess
            currentCleaningPath={cleaningState.currentCleaningPath}
            cleanedProgress={cleaningState.progress}
            deletedFiles={cleaningState.deletedFiles}
            freeSpaceGained={cleaningState.spaceGained}
            onStopCleaning={handleStopCleaning}
            useTranslationContext={useTranslationContext}
          />
        )}
        {cleaningState.cleaningCompleted && !cleaningState.cleaning && (
          <CleaningFinished
            deletedFiles={cleaningState.deletedFiles}
            freeSpaceGained={cleaningState.spaceGained}
            onFinish={handleFinishView}
            useTranslationContext={useTranslationContext}
          />
        )}
      </div>
    </div>
  );
}
