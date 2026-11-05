import { components } from '@/backend/infra/schema';

export type ClientCompatibility = components['schemas']['ClientCompatibilityResponseDto'];

export type ClientCompatibilityStatus = ClientCompatibility['status'];

/**
 * Mirrors the backend response, so the response can be used as is.
 * - up_to_date: the app works normally.
 * - update_recommended / deprecated: the app works normally but the user is asked to update.
 * - unsupported: the backend rejects this version, so every feature must stop until the user updates.
 *
 * Only `status` is required because a request rejected with the unsupported version error code does not carry the rest.
 */
export type ClientCompatibilityState = Pick<ClientCompatibility, 'status'> & Partial<Omit<ClientCompatibility, 'status'>>;
