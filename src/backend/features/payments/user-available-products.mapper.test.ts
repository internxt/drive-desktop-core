import { Tier } from '@internxt/sdk/dist/drive/payments/types/tiers';

import { mockProps } from '@/tests/vitest/utils.helper.test';

import { userAvailableProductsMapper } from './user-available-products.mapper';

describe('userAvailableProductsMapper', () => {
  it('should correctly map an object of Tier["featuresPerService"] into the proper domain object', () => {
    const mockFeaturesPerService: Tier['featuresPerService'] = mockProps<typeof userAvailableProductsMapper>({
      drive: {
        enabled: true,
      },
      backups: { enabled: true },
      antivirus: { enabled: false },
      meet: { enabled: false, paxPerCall: 0 },
      mail: { enabled: false, addressesPerUser: 0 },
      vpn: { enabled: false, featureId: '123' },
      cleaner: { enabled: true },
    });

    const result = userAvailableProductsMapper(mockFeaturesPerService);

    expect(result).toStrictEqual({
      backups: true,
      antivirus: false,
      cleaner: true,
    });
  });

  it('should correctly map into the proper domain object even though we recieve incorrect properties', () => {
    const mockFeaturesPerService: Tier['featuresPerService'] = mockProps<typeof userAvailableProductsMapper>({
      vpn: { enabled: false, featureId: '123' },
      antivirus: { enabled: null } as unknown as Tier['featuresPerService']['antivirus'],
      backups: { enabled: true },
    });

    const result = userAvailableProductsMapper(mockFeaturesPerService);

    expect(result).toStrictEqual({
      backups: true,
      antivirus: false,
      cleaner: false,
    });
  });
});
