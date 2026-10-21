import { checkUploadFileSize } from './services/check-upload-file-size';
import { resetFileSizeLimitRevalidation, revalidateFileSizeLimit } from './services/revalidate-file-size-limit';
import { validateUploadFileSize } from './services/validate-upload-file-size';

export { ABSOLUTE_UPLOAD_FILE_SIZE_LIMIT } from './constants';
export type { FileSizeLimitAdapter, UploadFileSizeValidation } from './file-size-limit.types';
export const FileSizeLimitModule = {
  checkUploadFileSize,
  revalidateFileSizeLimit,
  resetFileSizeLimitRevalidation,
  validateUploadFileSize,
};
