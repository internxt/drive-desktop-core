const WEB_BROWSER_DIRECTORIES = [
  'google',
  'chromium',
  'firefox',
  'opera',
  'brave',
  'chrome',
  'mozilla',
  'edge',
];

export function isDirectoryWebBrowserRelated(directoryName: string): boolean {
  const lowerName = directoryName.toLowerCase();
  return WEB_BROWSER_DIRECTORIES.some((browserName) => lowerName.includes(browserName));
}
