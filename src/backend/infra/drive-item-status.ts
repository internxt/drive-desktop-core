import type { ApiDriveItemStatus } from './drive-api.dto';

export enum DriveItemStatus {
  EXISTS = 'EXISTS',
  TRASHED = 'TRASHED',
  DELETED = 'DELETED',
}

const driveItemStatusByApiValue: Record<ApiDriveItemStatus, DriveItemStatus> = {
  EXISTS: DriveItemStatus.EXISTS,
  TRASHED: DriveItemStatus.TRASHED,
  DELETED: DriveItemStatus.DELETED,
};

const driveItemStatusValues = new Set<string>(Object.values(DriveItemStatus));

export function isDriveItemStatus(value: string): value is DriveItemStatus {
  return driveItemStatusValues.has(value);
}

export function toDriveItemStatus(status: ApiDriveItemStatus): DriveItemStatus {
  return driveItemStatusByApiValue[status];
}
