import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

@Injectable()
export class PasswordResetCrypto {
  private readonly key: Buffer;

  constructor(config: ConfigService) {
    let key = config.get<string>('PASSWORD_RESET_MAIL_KEY');
    if (!key) {
      if (config.get<string>('NODE_ENV') === 'production') {
        throw new Error('PASSWORD_RESET_MAIL_KEY is required in production');
      }
      const database =
        config.get<string>('DATABASE_PATH') ||
        resolve(process.cwd(), 'data/toolhub.sqlite');
      const filename = resolve(dirname(database), 'password-reset-mail.key');
      mkdirSync(dirname(filename), { recursive: true });
      if (!existsSync(filename)) {
        try {
          writeFileSync(filename, randomBytes(32).toString('hex'), {
            flag: 'wx',
            mode: 0o600,
          });
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
        }
      }
      key = readFileSync(filename, 'utf8').trim();
    }
    if (!/^[a-f0-9]{64}$/i.test(key))
      throw new Error('Invalid PASSWORD_RESET_MAIL_KEY');
    this.key = Buffer.from(key, 'hex');
  }

  hash(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  encrypt(value: { email: string; token: string }): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    const data = Buffer.concat([
      cipher.update(JSON.stringify(value), 'utf8'),
      cipher.final(),
    ]);
    return Buffer.concat([iv, cipher.getAuthTag(), data]).toString('base64');
  }

  decrypt(payload: string): { email: string; token: string } {
    const buffer = Buffer.from(payload, 'base64');
    const decipher = createDecipheriv(
      'aes-256-gcm',
      this.key,
      buffer.subarray(0, 12),
    );
    decipher.setAuthTag(buffer.subarray(12, 28));
    const value: unknown = JSON.parse(
      Buffer.concat([
        decipher.update(buffer.subarray(28)),
        decipher.final(),
      ]).toString('utf8'),
    );
    if (
      !value ||
      typeof value !== 'object' ||
      !('email' in value) ||
      !('token' in value) ||
      typeof value.email !== 'string' ||
      typeof value.token !== 'string'
    ) {
      throw new Error('Invalid queued mail');
    }
    return { email: value.email, token: value.token };
  }
}
