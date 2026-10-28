//Đổi MK
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

export class PasswordHasher {
  static hash(password: string): { hash: string; salt: string } {
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(password, salt, 64).toString('hex');
    return { hash, salt };
  }

  static verify(password: string, hash: string, salt: string): boolean {
    const derived = scryptSync(password, salt, 64);
    const stored = Buffer.from(hash, 'hex');
    if (derived.length !== stored.length) {
      return false;
    }
    return timingSafeEqual(derived, stored);
  }
}
