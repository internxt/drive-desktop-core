import checkDiskSpace from 'check-disk-space';

export async function getDiskSpace(): Promise<number> {
  try {
    const basePath = process.platform === 'win32' ? 'C:\\' : '/';
    const { size } = await checkDiskSpace(basePath);
    return size;
  } catch (error) {
    return 0;
  }
}
