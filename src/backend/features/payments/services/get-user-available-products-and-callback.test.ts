import { Payments } from '@internxt/sdk/dist/drive';

import { logger } from '@/backend/core/logger/logger';
import { partialSpyOn } from '@/tests/vitest/utils.helper.test';

import * as areProductsEqualFile from './are-products-equal';
import * as getPaymentsClientFile from './get-payments-client';
import { PaymentsClientConfig } from './get-payments-client';
import * as getUserAvailableProductsFile from './get-user-available-products';
import { getUserAvailableProductsAndCallback } from './get-user-available-products-and-callback';

vi.mock(import('@/backend/core/logger/logger'));

describe('getUserAvailableProductsAndCallback', () => {
  const mockLogger = vi.mocked(logger);
  const areProductsEqualMock = partialSpyOn(areProductsEqualFile, 'areProductsEqual');
  const getPaymentsClientMock = partialSpyOn(getPaymentsClientFile, 'getPaymentsClient');
  const getUserAvailableProductsMock = partialSpyOn(getUserAvailableProductsFile, 'getUserAvailableProducts');

  const mockPaymentsClient = {} as Payments;
  const mockPaymentsClientConfig = {} as PaymentsClientConfig;
  const mockCallbackOnProductsNotEqual = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    getPaymentsClientMock.mockReturnValue(mockPaymentsClient);
  });

  it('should call callback when products are not equal', async () => {
    const storedProducts = { backups: true, antivirus: false, cleaner: true };
    const fetchedProducts = { backups: false, antivirus: true, cleaner: true };

    getUserAvailableProductsMock.mockResolvedValue(fetchedProducts);
    areProductsEqualMock.mockReturnValue(false);

    await getUserAvailableProductsAndCallback({
      storedProducts,
      paymentsClientConfig: mockPaymentsClientConfig,
      callbackOnProductsNotEqual: mockCallbackOnProductsNotEqual,
    });

    expect(getPaymentsClientMock).toHaveBeenCalledWith(mockPaymentsClientConfig);
    expect(getUserAvailableProductsMock).toHaveBeenCalledWith({ paymentsClient: mockPaymentsClient });
    expect(areProductsEqualMock).toHaveBeenCalledWith({ stored: storedProducts, fetched: fetchedProducts });
    expect(mockCallbackOnProductsNotEqual).toHaveBeenCalledTimes(1);
  });

  it('should not call callback when products are equal', async () => {
    const storedProducts = { backups: true, antivirus: false, cleaner: true };
    const fetchedProducts = { backups: true, antivirus: false, cleaner: true };

    getUserAvailableProductsMock.mockResolvedValue(fetchedProducts);
    areProductsEqualMock.mockReturnValue(true);

    await getUserAvailableProductsAndCallback({
      storedProducts,
      paymentsClientConfig: mockPaymentsClientConfig,
      callbackOnProductsNotEqual: mockCallbackOnProductsNotEqual,
    });

    expect(getPaymentsClientMock).toHaveBeenCalledWith(mockPaymentsClientConfig);
    expect(getUserAvailableProductsMock).toHaveBeenCalledWith({ paymentsClient: mockPaymentsClient });
    expect(areProductsEqualMock).toHaveBeenCalledWith({ stored: storedProducts, fetched: fetchedProducts });
    expect(mockCallbackOnProductsNotEqual).not.toHaveBeenCalled();
  });

  it('should handle errors and log them without throwing', async () => {
    const mockError = new Error('API Error');
    getUserAvailableProductsMock.mockRejectedValue(mockError);

    await expect(
      getUserAvailableProductsAndCallback({
        storedProducts: undefined,
        paymentsClientConfig: mockPaymentsClientConfig,
        callbackOnProductsNotEqual: mockCallbackOnProductsNotEqual,
      }),
    ).resolves.toBeUndefined();

    expect(mockLogger.error).toHaveBeenCalledWith({
      tag: 'PRODUCTS',
      msg: 'Failed to get user available products with error:',
      error: mockError,
    });
    expect(mockCallbackOnProductsNotEqual).not.toHaveBeenCalled();
  });
});
