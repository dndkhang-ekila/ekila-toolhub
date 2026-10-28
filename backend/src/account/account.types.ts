export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  phone?: string;
  role?: string;
  plan?: string;
  isEmailVerified?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserAccount extends UserProfile {
  passwordHash: string;
  passwordSalt: string;
  tokenVersion: number;
}
