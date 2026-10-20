import { checkUploadFileSize } from './services/check-upload-file-size';
import { resetFileSizeLimitRevalidation, revalidateFileSizeLimit } from './services/revalidate-file-size-limit';
import { validateUploadFileSize } from './services/validate-upload-file-size';

export { ABSOLUTE_UPLOAD_FILE_SIZE_LIMIT } from './constants';
export type { FileSizeLimitAdapter } from './services/revalidate-file-size-limit';
export type { UploadFileSizeValidation } from './services/validate-upload-file-size';
export const FileSizeLimitModule = {
  checkUploadFileSize,
  revalidateFileSizeLimit,
  resetFileSizeLimitRevalidation,
  validateUploadFileSize,
};
