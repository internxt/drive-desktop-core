export const CLIENT_COMPATIBILITY_STATUSES = ['up_to_date', 'update_recommended', 'deprecated', 'unsupported'] as const;

export type ClientCompatibilityStatus = (typeof CLIENT_COMPATIBILITY_STATUSES)[number];

export type ClientCompatibility = {
  status: ClientCompatibilityStatus;
  message?: string;
  recommendedVersion?: string;
  sunsetAt?: Date;
};

export type ClientCompatibilityRequest = {
  baseUrl: string;
  clientName: string;
  clientVersion: string;
};

/**
 * Mirrors the backend status.
 * - up_to_date: the app works normally.
 * - update_recommended / deprecated: the app works normally but the user is asked to update.
 * - unsupported: the backend rejects this version, so sync and every request must stop until the user updates.
 */
export type ClientCompatibilityState =
  | { status: 'up_to_date' }
  | { status: 'update_recommended' | 'deprecated'; sunsetAt?: Date; recommendedVersion?: string }
  | { status: 'unsupported'; recommendedVersion?: string };

export type ClientCompatibilityListener = (state: ClientCompatibilityState) => void;
