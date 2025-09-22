export function isInternxtRelated(name: string) {
  const internxtPatterns = [/internxt/i, /drive-desktop/i];

  return internxtPatterns.some((pattern) => pattern.test(name));
}
