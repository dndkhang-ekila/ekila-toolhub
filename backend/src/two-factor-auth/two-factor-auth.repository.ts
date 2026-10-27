import { Injectable } from '@nestjs/common';
import { UserTwoFactorRecord } from './two-factor-auth.types';

@Injectable()
export class TwoFactorAuthRepository {
  private readonly store = new Map<string, UserTwoFactorRecord>();

  findByUserId(userId: string): Promise<UserTwoFactorRecord | null> {
    const record = this.store.get(userId);
    if (!record) {
      return Promise.resolve(null);
    }
    return Promise.resolve({ ...record });
  }

  saveTempSecret(
    userId: string,
    accountName: string,
    tempSecret: string,
    tempHashedBackupCodes: string[],
  ): Promise<void> {
    const existing = this.store.get(userId);
    const now = new Date();

    const record: UserTwoFactorRecord = {
      userId,
      accountName,
      isEnabled: existing?.isEnabled ?? false,
      secret: existing?.secret ?? '',
      tempSecret,
      tempHashedBackupCodes,
      hashedBackupCodes: existing?.hashedBackupCodes ?? [],
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    this.store.set(userId, record);
    return Promise.resolve();
  }

  enable(userId: string): Promise<void> {
    const existing = this.store.get(userId);
    if (!existing || !existing.tempSecret) {
      return Promise.reject(new Error('No pending two factor secret found'));
    }

    const now = new Date();
    existing.isEnabled = true;
    existing.secret = existing.tempSecret;
    existing.hashedBackupCodes = existing.tempHashedBackupCodes ?? [];
    existing.tempSecret = undefined;
    existing.tempHashedBackupCodes = undefined;
    existing.updatedAt = now;

    this.store.set(userId, existing);
    return Promise.resolve();
  }

  disable(userId: string): Promise<void> {
    const existing = this.store.get(userId);
    if (!existing) {
      return Promise.resolve();
    }

    const now = new Date();
    existing.isEnabled = false;
    existing.secret = '';
    existing.tempSecret = undefined;
    existing.tempHashedBackupCodes = undefined;
    existing.hashedBackupCodes = [];
    existing.updatedAt = now;

    this.store.set(userId, existing);
    return Promise.resolve();
  }

  consumeBackupCode(userId: string, codeHash: string): Promise<number> {
    const existing = this.store.get(userId);
    if (!existing) {
      return Promise.resolve(0);
    }

    const initialLength = existing.hashedBackupCodes.length;
    existing.hashedBackupCodes = existing.hashedBackupCodes.filter(
      (h) => h !== codeHash,
    );

    if (existing.hashedBackupCodes.length !== initialLength) {
      existing.updatedAt = new Date();
      this.store.set(userId, existing);
    }

    return Promise.resolve(existing.hashedBackupCodes.length);
  }
}
