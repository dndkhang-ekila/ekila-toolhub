export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserAccount extends UserProfile {
  passwordHash: string;
  passwordSalt: string;
  tokenVersion: number;
}
