import { Result } from '@/common/result';

import { FileSizeLimitAdapter } from '../file-size-limit.types';
import { revalidateFileSizeLimit, wasFileSizeLimitRevalidatedRecently } from './revalidate-file-size-limit';
import { validateUploadFileSize } from './validate-upload-file-size';

type Props = FileSizeLimitAdapter & {
  size: number;
};

/**
 * v1.5.0 Victor Fernandez
 * The backend is asked at most once every 15 minutes and only when the stored limit rejects the file, so most uploads
 * never trigger a request. If the backend cannot be reached the file is rejected with the stored limit.
 */
export async function checkUploadFileSize({ size, getStoredLimit, saveLimit, fetchLimit }: Props) {
  const validation = validateUploadFileSize({ size, maxUploadFileSize: getStoredLimit() });

  if (validation.allowed || validation.reason === 'ABSOLUTE_CAP_EXCEEDED' || wasFileSizeLimitRevalidatedRecently()) {
    return validation;
  }

  const res = await revalidateFileSizeLimit({ saveLimit, fetchLimit });

  if (Result.isError(res)) return validation;

  return validateUploadFileSize({ size, maxUploadFileSize: res.data });
}
