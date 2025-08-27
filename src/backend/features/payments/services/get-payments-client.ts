import { Payments } from '@internxt/sdk/dist/drive';

export type PaymentsClientConfig = {
  paymentsUrl: string;
  desktopHeader: string;
  clientName: string;
  clientVersion: string;
  token: string;
  unauthorizedCallback: () => void;
};

let paymentsClient: Payments;

export function getPaymentsClient({
  paymentsUrl,
  desktopHeader,
  clientName,
  clientVersion,
  token,
  unauthorizedCallback,
}: PaymentsClientConfig) {
  if (!paymentsClient) {
    paymentsClient = Payments.client(
      paymentsUrl,
      {
        clientName,
        clientVersion,
        desktopHeader,
      },
      {
        unauthorizedCallback,
        token,
      },
    );
  }

  return paymentsClient;
}
