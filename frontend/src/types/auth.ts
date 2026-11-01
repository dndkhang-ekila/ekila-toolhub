export type UserRole = 'guest' | 'free' | 'pro' | 'admin';
export type UserPlan = 'free' | 'pro';
export type UserLocale = 'vi' | 'en';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  plan: UserPlan;
  locale: UserLocale;
  isEmailVerified: boolean;
  name?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  locale?: UserLocale;
}

export interface VerifyEmailData {
  email?: string;
  code?: string;
  token?: string;
}

export interface ResendVerificationData {
  email: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  user?: User;
  tokens?: AuthTokens;
  requiresEmailVerification?: boolean;
  verificationEmail?: string;
}

export interface ApiErrorResponse {
  statusCode?: number;
  message: string | string[];
  error?: string;
}
