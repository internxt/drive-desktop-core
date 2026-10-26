import { checkUploadFileSize } from './services/check-upload-file-size';
import { revalidateFileSizeLimit } from './services/revalidate-file-size-limit';
import { validateUploadFileSize } from './services/validate-upload-file-size';
import { stopWatchingFileSizeLimit, watchFileSizeLimitAfterUpgrade } from './services/watch-file-size-limit-after-upgrade';

export { ABSOLUTE_UPLOAD_FILE_SIZE_LIMIT } from './constants';
export type { FileSizeLimitAdapter, UploadFileSizeValidation } from './file-size-limit.types';
export const FileSizeLimitModule = {
  checkUploadFileSize,
  revalidateFileSizeLimit,
  validateUploadFileSize,
  watchFileSizeLimitAfterUpgrade,
  stopWatchingFileSizeLimit,
};
