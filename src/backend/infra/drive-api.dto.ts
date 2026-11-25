import type { components } from './schema';

export type FileSyncDto = components['schemas']['FileSyncDto'];
export type FolderSyncDto = components['schemas']['FolderSyncDto'];
export type UserDto = components['schemas']['UserDto'];

export type ApiDriveItemStatus = FileSyncDto['status'];
