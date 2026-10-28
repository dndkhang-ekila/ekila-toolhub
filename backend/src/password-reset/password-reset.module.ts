import { Module } from '@nestjs/common';
import { PasswordResetController } from './password-reset.controller';
import { PasswordResetService } from './password-reset.service';
import { PasswordResetRepository } from './password-reset.repository';
import { PasswordResetCrypto } from './password-reset.crypto';
import { PasswordResetClock } from './password-reset.clock';
import { PasswordResetRateLimiter } from './password-reset-rate-limiter';
import { PasswordResetMailer } from './password-reset-mailer';
import { PasswordResetWorker } from './password-reset.worker';

@Module({
  controllers: [PasswordResetController],
  providers: [
    PasswordResetService,
    PasswordResetRepository,
    PasswordResetCrypto,
    PasswordResetClock,
    PasswordResetRateLimiter,
    PasswordResetMailer,
    PasswordResetWorker,
  ],
})
export class PasswordResetModule {}
