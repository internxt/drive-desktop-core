import { CleanerSectionViewModel } from '@/backend/features/cleaner/types/cleaner.types';

export function toggleItem({ viewModel, itemPath }: { viewModel: CleanerSectionViewModel; itemPath: string }) {
  const exceptions = [...viewModel.exceptions];
  const exceptionIndex = exceptions.indexOf(itemPath);

  if (exceptionIndex >= 0) {
    exceptions.splice(exceptionIndex, 1);
  } else {
    exceptions.push(itemPath);
  }

  return {
    ...viewModel,
    exceptions,
  };
}
