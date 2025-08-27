import { Tier } from '@internxt/sdk/dist/drive/payments/types/tiers';

import { UserAvailableProducts } from './payments.types';

export function userAvailableProductsMapper(featuresPerService: Tier['featuresPerService']): UserAvailableProducts {
  return {
    backups: !!featuresPerService['backups']?.enabled,
    antivirus: !!featuresPerService['antivirus']?.enabled,
    cleaner: !!featuresPerService['cleaner']?.enabled,
  };
}
