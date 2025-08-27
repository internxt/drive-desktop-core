import { Payments } from '@internxt/sdk/dist/drive';
import { Tier } from '@internxt/sdk/dist/drive/payments/types/tiers';
import { mockDeep } from 'vitest-mock-extended';

import { partialSpyOn } from '@/tests/vitest/utils.helper.test';

import * as userAvailableProductsMapperFile from '../user-available-products.mapper';
import { getUserAvailableProducts } from './get-user-available-products';

describe('getUserAvailableProducts', () => {
  const userAvailableProductsMapperMock = partialSpyOn(userAvailableProductsMapperFile, 'userAvailableProductsMapper');
  const paymentsClientMock = mockDeep<Payments>();

  const getUserTierResponseMock = {
    featuresPerService: {
      backups: { enabled: true },
      antivirus: { enabled: true },
      cleaner: { enabled: true },
    },
  } as Tier;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should properly fetch for the user available products and map the result to the object domain', async () => {
    paymentsClientMock.getUserTier.mockResolvedValue(getUserTierResponseMock);

    const mockMappedResult = {
      backups: true,
      antivirus: false,
      cleaner: true,
    };

    userAvailableProductsMapperMock.mockReturnValue(mockMappedResult);

    const result = await getUserAvailableProducts({ paymentsClient: paymentsClientMock });
    expect(paymentsClientMock.getUserTier).toHaveBeenCalledTimes(1);
    expect(userAvailableProductsMapperMock).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockMappedResult);
  });

  it('should propagate errors from paymentsClient.getUserTier', async () => {
    const mockError = new Error('API Error');
    paymentsClientMock.getUserTier.mockRejectedValue(mockError);

    await expect(getUserAvailableProducts({ paymentsClient: paymentsClientMock })).rejects.toThrow('API Error');
    expect(paymentsClientMock.getUserTier).toHaveBeenCalledTimes(1);
    expect(userAvailableProductsMapperMock).not.toHaveBeenCalled();
  });
});
