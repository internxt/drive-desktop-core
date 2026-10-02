export function isUpdatedAtEpoch(updatedAt: string): boolean {
  return new Date(0).toISOString() === updatedAt;
}
