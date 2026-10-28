import { Injectable } from '@nestjs/common';
import { isEmail } from 'class-validator';
import { randomBytes } from 'node:crypto';
import * as bcrypt from 'bcryptjs';
import { PasswordResetClock } from './password-reset.clock';
import { PasswordResetCrypto } from './password-reset.crypto';
import { PasswordResetRepository } from './password-reset.repository';
import { PasswordResetRateLimiter } from './password-reset-rate-limiter';
import { PasswordResetError } from './password-reset.errors';

@Injectable()
export class PasswordResetService {
  constructor(
    private readonly repository: PasswordResetRepository,
    private readonly crypto: PasswordResetCrypto,
    private readonly limiter: PasswordResetRateLimiter,
    private readonly clock: PasswordResetClock,
  ) {}

  async forgot(email: unknown, ip: string): Promise<void> {
    this.limiter.check(
      'forgot',
      ip,
      typeof email === 'string'
        ? email.trim().toLowerCase().slice(0, 254)
        : 'invalid',
    );
    if (
      typeof email !== 'string' ||
      email.trim().length > 254 ||
      !isEmail(email.trim())
    ) {
      throw new PasswordResetError('INVALID_EMAIL', 400);
    }
    const normalized = email.trim().toLowerCase();
    const token = randomBytes(32).toString('base64url');
    await this.repository.enqueue(
      this.crypto.encrypt({ email: normalized, token }),
      this.clock.now(),
    );
  }

  private token(value: unknown): string {
    if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(value)) {
      throw new PasswordResetError('RESET_LINK_INVALID', 400);
    }
    return value;
  }

  async validate(value: unknown, ip: string): Promise<void> {
    this.limiter.check(
      'validate',
      ip,
      typeof value === 'string' ? value.slice(0, 256) : 'invalid',
    );
    const token = this.token(value);
    if (
      !(await this.repository.validate(
        this.crypto.hash(token),
        this.clock.now(),
      ))
    ) {
      throw new PasswordResetError('RESET_LINK_INVALID', 400);
    }
  }

  async reset(value: unknown, newPassword: unknown, ip: string): Promise<void> {
    this.limiter.check(
      'reset',
      ip,
      typeof value === 'string' ? value.slice(0, 256) : 'invalid',
    );
    const token = this.token(value);
    if (
      typeof newPassword !== 'string' ||
      newPassword.length < 8 ||
      Buffer.byteLength(newPassword, 'utf8') > 72 ||
      !/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])/.test(newPassword)
    ) {
      throw new PasswordResetError('PASSWORD_POLICY_VIOLATION', 422);
    }
    const tokenHash = this.crypto.hash(token);
    if (!(await this.repository.validate(tokenHash, this.clock.now()))) {
      throw new PasswordResetError('RESET_LINK_INVALID', 400);
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.repository.consume(tokenHash, passwordHash, () =>
      this.clock.now(),
    );
  }
}
