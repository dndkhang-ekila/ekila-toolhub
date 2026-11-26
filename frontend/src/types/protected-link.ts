/**
 * Types cho tính năng [FR-URL-10][FE] Bảo vệ link bằng mật khẩu
 */

export interface ProtectedLinkMeta {
  slug: string;
  hasPassword: boolean;
  passwordHash?: string;
  originalUrl?: string;
  updatedAt: number;
}

export interface PasswordVerificationResult {
  success: boolean;
  message?: string;
  originalUrl?: string;
  remainingAttempts?: number;
  lockedUntil?: number;
}
