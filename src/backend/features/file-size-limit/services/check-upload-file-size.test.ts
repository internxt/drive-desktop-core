import { Result } from '@/common/result';
import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';

import { ABSOLUTE_UPLOAD_FILE_SIZE_LIMIT } from '../constants';
import { checkUploadFileSize } from './check-upload-file-size';
import * as revalidateFileSizeLimitModule from './revalidate-file-size-limit';

describe('check-upload-file-size', () => {
  const revalidateFileSizeLimitMock = partialSpyOn(revalidateFileSizeLimitModule, 'revalidateFileSizeLimit');
  const wasRevalidatedRecentlyMock = partialSpyOn(revalidateFileSizeLimitModule, 'wasFileSizeLimitRevalidatedRecently');

  let props: Parameters<typeof checkUploadFileSize>[0];

  beforeEach(() => {
    wasRevalidatedRecentlyMock.mockReturnValue(false);
    revalidateFileSizeLimitMock.mockResolvedValue({ data: 100 });

    props = mockProps<typeof checkUploadFileSize>({ size: 50, getStoredLimit: () => 10 });
  });

  it('should allow the file without asking the backend if it fits the stored limit', async () => {
    // Given
    props.size = 5;
    // When
    const res = await checkUploadFileSize(props);
    // Then
    expect(res).toStrictEqual({ allowed: true });
    calls(revalidateFileSizeLimitMock).toHaveLength(0);
  });

  it('should reject the file without asking the backend if it exceeds the highest plan', async () => {
    // Given
    props.size = ABSOLUTE_UPLOAD_FILE_SIZE_LIMIT + 1;
    // When
    const res = await checkUploadFileSize(props);
    // Then
    expect(res).toMatchObject({ allowed: false, reason: 'ABSOLUTE_CAP_EXCEEDED' });
    calls(revalidateFileSizeLimitMock).toHaveLength(0);
  });

  it('should reject the file without asking the backend if the limit was revalidated recently', async () => {
    // Given
    wasRevalidatedRecentlyMock.mockReturnValue(true);
    // When
    const res = await checkUploadFileSize(props);
    // Then
    expect(res).toMatchObject({ allowed: false, reason: 'PLAN_LIMIT_EXCEEDED', maxFileSize: 10 });
    call(wasRevalidatedRecentlyMock).toStrictEqual({ getLastRevalidatedAt: props.getLastRevalidatedAt });
    calls(revalidateFileSizeLimitMock).toHaveLength(0);
  });

  it('should allow the file if it fits the limit returned by the backend', async () => {
    // When
    const res = await checkUploadFileSize(props);
    // Then
    expect(res).toStrictEqual({ allowed: true });
    call(revalidateFileSizeLimitMock).toStrictEqual({
      saveLimit: props.saveLimit,
      saveLastRevalidatedAt: props.saveLastRevalidatedAt,
      fetchLimit: props.fetchLimit,
    });
  });

  it('should reject the file if it does not fit the limit returned by the backend', async () => {
    // Given
    revalidateFileSizeLimitMock.mockResolvedValue({ data: 20 });
    // When
    const res = await checkUploadFileSize(props);
    // Then
    expect(res).toMatchObject({ allowed: false, reason: 'PLAN_LIMIT_EXCEEDED', maxFileSize: 20 });
  });

  it('should reject the file with the stored limit if the backend cannot be reached', async () => {
    // Given
    revalidateFileSizeLimitMock.mockResolvedValue(Result.err(new Error('Network error')));
    // When
    const res = await checkUploadFileSize(props);
    // Then
    expect(res).toMatchObject({ allowed: false, reason: 'PLAN_LIMIT_EXCEEDED', maxFileSize: 10 });
  });
});
