import { PasswordResetError } from "../types/password-reset.types";

export function passwordResetErrorKey(error: unknown) {
  if (!(error instanceof PasswordResetError)) return "unavailable";
  switch (error.code) {
    case "INVALID_EMAIL":
      return "invalidEmail";
    case "PASSWORD_POLICY_VIOLATION":
      return "passwordPolicy";
    case "RATE_LIMITED":
      return "rateLimited";
    case "NETWORK_ERROR":
      return "network";
    default:
      return "unavailable";
  }
}
