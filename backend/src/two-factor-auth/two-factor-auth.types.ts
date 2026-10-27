export interface UserTwoFactorRecord {
  userId: string;
  accountName: string;
  isEnabled: boolean;
  secret: string;
  tempSecret?: string;
  tempHashedBackupCodes?: string[];
  hashedBackupCodes: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TwoFactorSetupResponse {
  secret: string;
  otpauthUri: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface TwoFactorVerifyResult {
  verified: boolean;
  method: 'totp' | 'backup';
  remainingBackupCodes?: number;
}

export interface TwoFactorStatusResponse {
  userId: string;
  isEnabled: boolean;
  remainingBackupCodes: number;
}
