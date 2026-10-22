import { ABSOLUTE_UPLOAD_FILE_SIZE_LIMIT } from '../constants';
import { UploadFileSizeValidation } from '../file-size-limit.types';

type Props = {
  size: number;
  maxUploadFileSize: number;
};

export function validateUploadFileSize({ size, maxUploadFileSize }: Props): UploadFileSizeValidation {
  if (size > ABSOLUTE_UPLOAD_FILE_SIZE_LIMIT) {
    return {
      allowed: false,
      reason: 'ABSOLUTE_CAP_EXCEEDED',
      maxFileSize: ABSOLUTE_UPLOAD_FILE_SIZE_LIMIT,
      showUpgradeCta: false,
    };
  }

  if (maxUploadFileSize && size > maxUploadFileSize) {
    return {
      allowed: false,
      reason: 'PLAN_LIMIT_EXCEEDED',
      maxFileSize: maxUploadFileSize,
      showUpgradeCta: true,
    };
  }

  return { allowed: true };
}
