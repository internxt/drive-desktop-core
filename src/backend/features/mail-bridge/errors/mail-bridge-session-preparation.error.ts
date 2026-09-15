import type { MailBridgeSessionPreparationErrorCode } from '../constants';

/**
 * Describes the expected failure while obtaining or unlocking Mail session material.
 */
export class MailBridgeSessionPreparationError extends Error {
  public readonly status: number | undefined;
  public readonly remoteCode: string | undefined;

  constructor(
    public readonly code: MailBridgeSessionPreparationErrorCode,
    message: string,
    details: { status: number | undefined; remoteCode: string | undefined } = { status: undefined, remoteCode: undefined },
  ) {
    super(message);
    this.status = details.status;
    this.remoteCode = details.remoteCode;
    Object.setPrototypeOf(this, MailBridgeSessionPreparationError.prototype);
  }
}
