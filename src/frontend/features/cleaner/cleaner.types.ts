import { CleanerSectionKey, CleanerViewModel, ExtendedCleanerReport } from '@/backend/features/cleaner/types/cleaner.types';

export type CleanerContextType = {
  report: ExtendedCleanerReport | null;
  loading: boolean;
  isCleanerAvailable: boolean;
  cleaningState: {
    cleaning: boolean;
    cleaningCompleted: boolean;
    currentCleaningPath: string;
    progress: number;
    deletedFiles: number;
    spaceGained: string;
  };
  diskSpace: number;
  sectionKeys: CleanerSectionKey[];
  generateReport: (force?: boolean) => Promise<void>;
  startCleanup: (viewModel: CleanerViewModel) => void;
  stopCleanup: () => void;
  setInitialCleaningState: () => void;
};

export type SectionConfig = Record<string, { name: string; color: string }>;
