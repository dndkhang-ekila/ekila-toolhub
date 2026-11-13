import { Injectable } from '@nestjs/common';
import { PasswordResetClock } from './password-reset.clock';
import { PasswordResetCrypto } from './password-reset.crypto';
import { PasswordResetError } from './password-reset.errors';

@Injectable()
export class PasswordResetRateLimiter {
  private readonly counters = new Map<
    string,
    { count: number; until: number }
  >();

  constructor(
    private readonly clock: PasswordResetClock,
    private readonly crypto: PasswordResetCrypto,
  ) {}

  check(
    action: 'forgot' | 'validate' | 'reset',
    ip: string,
    identity: string,
  ): void {
    const now = this.clock.now().getTime();
    for (const [key, value] of this.counters) {
      if (value.until <= now) this.counters.delete(key);
    }
    const identityKey = this.crypto.hash(identity);
    const rules =
      action === 'forgot'
        ? [
            { key: `forgot-ip:${ip}`, max: 20, window: 3_600_000 },
            { key: `forgot-email:${identityKey}`, max: 5, window: 3_600_000 },
            { key: `forgot-cooldown:${identityKey}`, max: 1, window: 60_000 },
          ]
        : [
            { key: `${action}-ip:${ip}`, max: 30, window: 60_000 },
            { key: `${action}-token:${identityKey}`, max: 10, window: 60_000 },
          ];
    const blocked = rules
      .map((rule) => this.counters.get(rule.key))
      .filter((value, index) => value && value.count >= rules[index].max);
    if (blocked.length || this.counters.size > 10_000) {
      const retry = Math.max(
        1,
        ...blocked.map((value) => Math.ceil((value!.until - now) / 1000)),
      );
      throw new PasswordResetError('RATE_LIMITED', 429, retry);
    }
    for (const rule of rules) {
      const value = this.counters.get(rule.key);
      this.counters.set(
        rule.key,
        value
          ? { ...value, count: value.count + 1 }
          : { count: 1, until: now + rule.window },
      );
    }
  }
}
