import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PasswordResetClock } from './password-reset.clock';
import { PasswordResetCrypto } from './password-reset.crypto';
import { PasswordResetMailer } from './password-reset-mailer';
import { PasswordResetRepository } from './password-reset.repository';

@Injectable()
export class PasswordResetWorker
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(PasswordResetWorker.name);
  private timer?: NodeJS.Timeout;
  private active?: Promise<void>;
  private stopping = false;
  private lastCleanup = 0;

  constructor(
    private readonly config: ConfigService,
    private readonly repository: PasswordResetRepository,
    private readonly crypto: PasswordResetCrypto,
    private readonly mailer: PasswordResetMailer,
    private readonly clock: PasswordResetClock,
  ) {}

  onApplicationBootstrap(): void {
    if (
      this.config.get<string>('PASSWORD_RESET_WORKER_ENABLED', 'true') ===
      'false'
    )
      return;
    this.timer = setInterval(() => {
      void this.drain().catch(() =>
        this.logger.error('Password reset mail queue unavailable'),
      );
    }, 1000);
    this.timer.unref();
  }

  drain(): Promise<void> {
    if (this.active) return this.active;
    this.active = this.process().finally(() => {
      this.active = undefined;
    });
    return this.active;
  }

  private async process(): Promise<void> {
    for (let i = 0; i < 10 && !this.stopping; i++) {
      const job = await this.repository.claimMail(this.clock.now());
      if (!job) break;
      try {
        const payload = this.crypto.decrypt(job.encryptedPayload!);
        const token = await this.repository.issueForMail(
          job,
          payload.email,
          this.crypto.hash(payload.token),
          this.clock.now(),
        );
        if (!token) {
          await this.repository.finishMail(job, 'skipped', this.clock.now());
          continue;
        }
        await this.mailer.send(
          job.id,
          payload.email,
          payload.token,
          token.expiresAt,
        );
        await this.repository.finishMail(job, 'sent', this.clock.now());
      } catch {
        await this.repository.retryMail(job, this.clock.now());
        this.logger.warn(
          'Password reset email delivery deferred; no sensitive details logged',
        );
      }
    }
    const now = this.clock.now();
    if (now.getTime() - this.lastCleanup > 3_600_000) {
      await this.repository.cleanup(now);
      this.lastCleanup = now.getTime();
    }
  }

  async onModuleDestroy(): Promise<void> {
    this.stopping = true;
    if (this.timer) clearInterval(this.timer);
    await this.active;
  }
}
