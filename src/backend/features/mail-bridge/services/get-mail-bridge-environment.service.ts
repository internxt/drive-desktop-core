import { Result } from '../../../../common/result';

type GetMailBridgeEnvironmentProps = {
  inheritedEnvironment: NodeJS.ProcessEnv;
  mailApiUrl: string | undefined;
  mailServerPublicKey: string | undefined;
};

export function getMailBridgeEnvironment({
  inheritedEnvironment,
  mailApiUrl,
  mailServerPublicKey,
}: GetMailBridgeEnvironmentProps): Result<NodeJS.ProcessEnv, Error> {
  if (!mailApiUrl?.trim()) return Result.err(new Error('Mail Bridge requires MAIL_API_URL'));

  const environment = copyEnvironment(inheritedEnvironment);
  environment.MAIL_API_URL = mailApiUrl;
  environment.MAIL_SERVER_PUBLIC_KEY = mailServerPublicKey;

  return Result.ok(environment);
}

/**
 * Alexis Mora
 *
 * ProcessEnv declares PORT as a number, which conflicts with its string index
 * signature when spreading a concrete environment object. The generic keeps
 * the declared type on the copy without changing the shared environment types.
 */
function copyEnvironment<T extends NodeJS.ProcessEnv>(environment: T): T {
  return { ...environment };
}
