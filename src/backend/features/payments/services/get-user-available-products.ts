import { Payments } from '@internxt/sdk/dist/drive';

import { userAvailableProductsMapper } from '../user-available-products.mapper';

type Props = { paymentsClient: Payments };

export async function getUserAvailableProducts({ paymentsClient }: Props) {
  const { featuresPerService } = await paymentsClient.getUserTier();
  return userAvailableProductsMapper(featuresPerService);
}
