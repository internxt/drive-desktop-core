import { CleanerSectionKey, CleanerViewModel, ExtendedCleanerReport, CleanerSection } from '@/backend/features/cleaner/types/cleaner.types';

export type SectionConfig = Record<string, { name: string; color: string }>;

export type CleanerContextType<T extends Record<string, CleanerSection> = {}> = {
  report: ExtendedCleanerReport<T> | null;
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
  sectionKeys: CleanerSectionKey<ExtendedCleanerReport<T>>[];
  generateReport: (force?: boolean) => Promise<void>;
  startCleanup: (viewModel: CleanerViewModel) => void;
  stopCleanup: () => void;
  setInitialCleaningState: () => void;
};
