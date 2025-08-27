import { logger } from '@/backend/core/logger/logger';

import { UserAvailableProducts } from '../payments.types';
import { areProductsEqual } from './are-products-equal';
import { getPaymentsClient, PaymentsClientConfig } from './get-payments-client';
import { getUserAvailableProducts } from './get-user-available-products';

type Props = {
  storedProducts?: UserAvailableProducts;
  paymentsClientConfig: PaymentsClientConfig;
  callbackOnProductsNotEqual: (fetchedProducts: UserAvailableProducts) => void;
};

export async function getUserAvailableProductsAndCallback({ storedProducts, paymentsClientConfig, callbackOnProductsNotEqual }: Props) {
  try {
    const paymentsClient = getPaymentsClient(paymentsClientConfig);
    const fetchedProducts = await getUserAvailableProducts({ paymentsClient });

    if (!areProductsEqual({ stored: storedProducts, fetched: fetchedProducts })) {
      callbackOnProductsNotEqual(fetchedProducts);
    }
  } catch (error) {
    logger.error({
      tag: 'PRODUCTS',
      msg: 'Failed to get user available products with error:',
      error,
    });
  }
}
