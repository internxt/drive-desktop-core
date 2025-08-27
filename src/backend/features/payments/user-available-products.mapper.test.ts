import { DriveFeatures, Tier } from '@internxt/sdk/dist/drive/payments/types/tiers';

import { userAvailableProductsMapper } from './user-available-products.mapper';

describe('userAvailableProductsMapper', () => {
  it('should correctly map an object of Tier["featuresPerService"] into the proper domain object', () => {
    const mockFeaturesPerService: Tier['featuresPerService'] = {
      drive: {
        enabled: true,
        maxSpaceBytes: 1,
        workspaces: {} as DriveFeatures['workspaces'],
      },
      backups: { enabled: true },
      antivirus: { enabled: false },
      meet: { enabled: false, paxPerCall: 0 },
      mail: { enabled: false, addressesPerUser: 0 },
      vpn: { enabled: false, featureId: '123' },
      cleaner: { enabled: true },
    };

    const result = userAvailableProductsMapper(mockFeaturesPerService);

    expect(result).toEqual({
      backups: true,
      antivirus: false,
      cleaner: true,
    });
  });

  it('should correctly map into the proper domain object even though we recieve incorrect properties', () => {
    const mockFeaturesPerService = {
      vpn: { enabled: false, featureId: '123' },
      antivirus: { enabled: null } as unknown as Tier['featuresPerService']['antivirus'],
      backups: { enabled: true },
    } as unknown as Tier['featuresPerService'];

    const result = userAvailableProductsMapper(mockFeaturesPerService);

    expect(result).toEqual({
      backups: true,
      antivirus: false,
      cleaner: false,
    });
  });
});
