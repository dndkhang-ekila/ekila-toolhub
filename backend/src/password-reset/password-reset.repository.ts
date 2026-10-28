import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DataSource, IsNull, MoreThan, LessThanOrEqual } from 'typeorm';
import { User } from '../auth/entities/user.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import {
  PasswordResetMailJob,
  type MailJobStatus,
} from './entities/password-reset-mail-job.entity';
import { PasswordResetError } from './password-reset.errors';

const locks = new WeakMap<DataSource, Promise<void>>();
export const RESET_TTL_MS = 30 * 60 * 1000;

@Injectable()
export class PasswordResetRepository {
  constructor(private readonly dataSource: DataSource) {}

  private async serialized<T>(action: () => Promise<T>): Promise<T> {
    const previous = locks.get(this.dataSource) || Promise.resolve();
    let release!: () => void;
    const current = new Promise<void>((resolve) => {
      release = resolve;
    });
    locks.set(
      this.dataSource,
      previous.then(() => current),
    );
    await previous;
    try {
      for (let attempt = 0; ; attempt++) {
        try {
          return await action();
        } catch (error) {
          const code = (error as { driverError?: { code?: string } })
            .driverError?.code;
          if (
            attempt >= 3 ||
            !['SQLITE_BUSY', 'SQLITE_LOCKED'].includes(code || '')
          )
            throw error;
          await new Promise((resolve) =>
            setTimeout(resolve, 10 * 2 ** attempt),
          );
        }
      }
    } finally {
      release();
    }
  }

  enqueue(encryptedPayload: string, now: Date): Promise<void> {
    return this.serialized(async () => {
      await this.dataSource.getRepository(PasswordResetMailJob).insert({
        id: randomUUID(),
        encryptedPayload,
        status: 'pending',
        attempts: 0,
        availableAt: now,
        createdAt: now,
        completedAt: null,
        leaseUntil: null,
        leaseId: null,
        tokenId: null,
      });
    });
  }

  claimMail(now: Date): Promise<PasswordResetMailJob | null> {
    return this.serialized(async () => {
      const repository = this.dataSource.getRepository(PasswordResetMailJob);
      await repository.update(
        { status: 'processing', leaseUntil: LessThanOrEqual(now) },
        {
          status: 'pending',
          leaseId: null,
          leaseUntil: null,
        },
      );
      const job = await repository.findOne({
        where: { status: 'pending', availableAt: LessThanOrEqual(now) },
        order: { createdAt: 'ASC' },
      });
      if (!job) return null;
      const leaseId = randomUUID();
      const result = await repository.update(
        { id: job.id, status: 'pending' },
        {
          status: 'processing',
          leaseId,
          leaseUntil: new Date(now.getTime() + 120_000),
          attempts: job.attempts + 1,
        },
      );
      if (result.affected !== 1) return null;
      return repository.findOneByOrFail({ id: job.id, leaseId });
    });
  }

  issueForMail(
    job: PasswordResetMailJob,
    email: string,
    tokenHash: string,
    now: Date,
  ): Promise<PasswordResetToken | null> {
    return this.serialized(() =>
      this.dataSource.transaction(async (manager) => {
        const jobs = manager.getRepository(PasswordResetMailJob);
        const owned = await jobs.findOneBy({
          id: job.id,
          status: 'processing',
          leaseId: job.leaseId!,
        });
        if (!owned) return null;
        const user = await manager.getRepository(User).findOneBy({ email });
        if (!user?.passwordHash || !user.isEmailVerified) return null;
        const tokens = manager.getRepository(PasswordResetToken);
        if (owned.tokenId) {
          return tokens.findOneBy({
            id: owned.tokenId,
            userId: user.id,
            usedAt: IsNull(),
            revokedAt: IsNull(),
            expiresAt: MoreThan(now),
          });
        }
        await tokens.update(
          { userId: user.id, usedAt: IsNull(), revokedAt: IsNull() },
          { revokedAt: now },
        );
        const token = tokens.create({
          id: randomUUID(),
          userId: user.id,
          tokenHash,
          createdAt: now,
          expiresAt: new Date(now.getTime() + RESET_TTL_MS),
          usedAt: null,
          revokedAt: null,
        });
        await tokens.insert(token);
        await jobs.update(
          { id: job.id, leaseId: job.leaseId! },
          { tokenId: token.id },
        );
        return token;
      }),
    );
  }

  finishMail(
    job: PasswordResetMailJob,
    status: MailJobStatus,
    now: Date,
  ): Promise<void> {
    return this.serialized(async () => {
      await this.dataSource.getRepository(PasswordResetMailJob).update(
        { id: job.id, leaseId: job.leaseId! },
        {
          status,
          encryptedPayload: null,
          leaseUntil: null,
          leaseId: null,
          completedAt: now,
        },
      );
    });
  }

  retryMail(job: PasswordResetMailJob, now: Date): Promise<void> {
    if (job.attempts >= 5) return this.finishMail(job, 'failed', now);
    return this.serialized(async () => {
      await this.dataSource.getRepository(PasswordResetMailJob).update(
        { id: job.id, leaseId: job.leaseId! },
        {
          status: 'pending',
          leaseUntil: null,
          leaseId: null,
          availableAt: new Date(
            now.getTime() + Math.min(300_000, 1000 * 2 ** job.attempts),
          ),
        },
      );
    });
  }

  validate(tokenHash: string, now: Date): Promise<boolean> {
    return this.serialized(async () => {
      const token = await this.dataSource
        .getRepository(PasswordResetToken)
        .findOneBy({
          tokenHash,
          usedAt: IsNull(),
          revokedAt: IsNull(),
          expiresAt: MoreThan(now),
        });
      if (!token) return false;
      const user = await this.dataSource
        .getRepository(User)
        .findOneBy({ id: token.userId });
      return !!user?.passwordHash && user.isEmailVerified;
    });
  }

  consume(
    tokenHash: string,
    passwordHash: string,
    now: () => Date,
  ): Promise<void> {
    return this.serialized(() =>
      this.dataSource.transaction(async (manager) => {
        const date = now();
        const tokens = manager.getRepository(PasswordResetToken);
        const claimed = await tokens.update(
          {
            tokenHash,
            usedAt: IsNull(),
            revokedAt: IsNull(),
            expiresAt: MoreThan(date),
          },
          { usedAt: date },
        );
        if (claimed.affected !== 1)
          throw new PasswordResetError('RESET_LINK_INVALID', 400);
        const token = await tokens.findOneByOrFail({ tokenHash });
        const updated = await manager
          .getRepository(User)
          .createQueryBuilder()
          .update()
          .set({
            passwordHash,
            tokenVersion: () => 'tokenVersion + 1',
          })
          .where(
            'id = :id AND isEmailVerified = 1 AND passwordHash IS NOT NULL',
            { id: token.userId },
          )
          .execute();
        if (updated.affected !== 1)
          throw new PasswordResetError('RESET_LINK_INVALID', 400);
        await tokens.update(
          { userId: token.userId, usedAt: IsNull(), revokedAt: IsNull() },
          { revokedAt: date },
        );
      }),
    );
  }

  cleanup(now: Date): Promise<void> {
    return this.serialized(async () => {
      const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      await this.dataSource
        .getRepository(PasswordResetMailJob)
        .delete({ completedAt: LessThanOrEqual(cutoff) });
      await this.dataSource
        .getRepository(PasswordResetToken)
        .delete({ expiresAt: LessThanOrEqual(cutoff) });
    });
  }
}
