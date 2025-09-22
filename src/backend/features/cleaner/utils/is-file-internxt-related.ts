export function isInternxtRelated(name: string): boolean {
  const internxtPatterns = [/internxt/i, /drive-desktop/i];

  return internxtPatterns.some((pattern) => pattern.test(name));
}
