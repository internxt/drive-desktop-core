import { CleanerSectionViewModel } from '@/backend/features/cleaner/types/cleaner.types';

export function isItemSelected({ viewModel, itemPath }: { viewModel: CleanerSectionViewModel; itemPath: string }) {
  const isException = viewModel.exceptions.includes(itemPath);
  return viewModel.selectedAll ? !isException : isException;
}
