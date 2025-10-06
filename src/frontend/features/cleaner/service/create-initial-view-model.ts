import { CleanerSectionKey, CleanerViewModel } from '@/backend/features/cleaner/types/cleaner.types';

type Props = {
  cleanerSectionKeys: CleanerSectionKey[];
  selectedAll?: boolean;
};

export function createInitialViewModel({ selectedAll = true }: Props) {
  const viewModel: CleanerViewModel = {
    appCache: { selectedAll, exceptions: [] },
    logFiles: { selectedAll, exceptions: [] },
    trash: { selectedAll, exceptions: [] },
    webCache: { selectedAll, exceptions: [] },
    webStorage: { selectedAll, exceptions: [] },
    platformSpecific: { selectedAll, exceptions: [] },
  };

  return viewModel;
}
