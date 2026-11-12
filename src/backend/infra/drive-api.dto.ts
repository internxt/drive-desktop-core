import type { AssertEqual } from '@/backend/core/utils/assert-equal.types';

import { DriveItemStatus } from './drive-item-status';
import type { components } from './schema';

export type UserDto = components['schemas']['UserDto'];

export type ApiDriveItemStatus = components['schemas']['FileSyncDto']['status'];

type _DriveItemStatusMatchesSchema = AssertEqual<DriveItemStatus, ApiDriveItemStatus>;
