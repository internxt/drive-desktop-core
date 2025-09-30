export type LocalContextProps = {
  translate: (key: string, keysToReplace?: Record<string, string | number>) => string;
  language: string;
};
