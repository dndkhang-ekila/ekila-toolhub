export type ThemePreference = 'light' | 'dark' | 'system';
export type LocalePreference = 'vi' | 'en';

export interface UserPreferences {
  theme: ThemePreference;
  locale: LocalePreference;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  phone?: string;
  theme: ThemePreference;
  locale: LocalePreference;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  scheduledPermanentDeletionAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserAccount extends UserProfile {
  passwordHash: string;
  passwordSalt: string;
  tokenVersion: number;
}

export interface DeleteAccountResponse {
  success: boolean;
  message: string;
  scheduledPermanentDeletionAt: Date;
  gracePeriodDays: number;
}
