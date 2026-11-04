import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { UrlPolicyError } from './url-policy.error';

@Injectable()
export class UrlPolicyRateLimiter {
  private readonly buckets = new Map<
    string,
    { expires: number; count: number }
  >();

  check(ip: string, now = Date.now()): void {
    for (const [key, bucket] of this.buckets) {
      if (bucket.expires <= now) this.buckets.delete(key);
    }
    const key = createHash('sha256').update(ip).digest('hex');
    const bucket = this.buckets.get(key);
    if (bucket) {
      if (bucket.count >= 20) throw new UrlPolicyError('RATE_LIMITED');
      bucket.count++;
    } else {
      if (this.buckets.size >= 10000) throw new UrlPolicyError('RATE_LIMITED');
      this.buckets.set(key, { count: 1, expires: now + 60000 });
    }
  }
}
