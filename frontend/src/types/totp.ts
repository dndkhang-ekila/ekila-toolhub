export interface TotpSetupData {
  secret: string;
  qrCodeUrl: string;
  otpauthUri: string;
  accountName: string;
  issuer: string;
  backupCodes: string[];
}

export type TotpVerificationMethod = 'app' | 'backup';

export interface TotpVerifyResult {
  success: boolean;
  message: string;
  remainingBackupCodes?: number;
}
