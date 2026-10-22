import { isLoopbackHostname } from './is-loopback-hostname';

type ListenerSettings = {
  imapHostname: string | undefined;
  smtpHostname: string | undefined;
  imapPort: number | undefined;
  smtpPort: number | undefined;
};

type ValidListenerSettings = {
  imapHostname: string;
  smtpHostname: string;
  imapPort: number;
  smtpPort: number;
};

export function hasValidListenerSettings(settings: ListenerSettings): settings is ValidListenerSettings {
  const { imapHostname, smtpHostname, imapPort, smtpPort } = settings;
  return Boolean(imapHostname && smtpHostname && imapHostname === smtpHostname && isLoopbackHostname(imapHostname) && imapPort && smtpPort);
}
