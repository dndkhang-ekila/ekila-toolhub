export type PasswordResetErrorCode =
  | "INVALID_EMAIL"
  | "RESET_LINK_INVALID"
  | "PASSWORD_POLICY_VIOLATION"
  | "RATE_LIMITED"
  | "SERVICE_UNAVAILABLE"
  | "NETWORK_ERROR";

export class PasswordResetError extends Error {
  constructor(
    public readonly code: PasswordResetErrorCode,
    public readonly retryAfter: number = 0,
  ) {
    super(code);
    this.name = "PasswordResetError";
  }
}
