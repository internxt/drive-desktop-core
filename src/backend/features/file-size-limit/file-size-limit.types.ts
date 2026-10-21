import { Result } from '@/common/result';

export type FileSizeLimitAdapter = {
  getStoredLimit: () => number;
  saveLimit: ({ limit }: { limit: number }) => void;
  fetchLimit: () => Promise<Result<number, Error>>;
};

export type UploadFileSizeValidation =
  | { allowed: true }
  | {
      allowed: false;
      reason: 'PLAN_LIMIT_EXCEEDED' | 'ABSOLUTE_CAP_EXCEEDED';
      maxFileSize: number;
      showUpgradeCta: boolean;
    };
