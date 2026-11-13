import { ConfigService } from '@nestjs/config';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { PasswordResetCrypto } from './password-reset.crypto';
import { PasswordResetMailer } from './password-reset-mailer';

describe('Password reset local configuration', () => {
  let directory: string;

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'fr-acc-03-crypto-'));
  });

  afterEach(() => {
    const target = resolve(directory);
    if (
      dirname(target) !== resolve(tmpdir()) ||
      !basename(target).startsWith('fr-acc-03-crypto-')
    )
      throw new Error('Unexpected test directory');
    rmSync(target, { recursive: true, force: true });
  });

  it('creates a stable local encryption key without recording it in the database', () => {
    const config = new ConfigService({
      NODE_ENV: 'development',
      DATABASE_PATH: join(directory, 'toolhub.sqlite'),
    });
    const first = new PasswordResetCrypto(config);
    const payload = first.encrypt({
      email: 'local@example.test',
      token: 'local-token',
    });
    const second = new PasswordResetCrypto(config);
    expect(second.decrypt(payload)).toEqual({
      email: 'local@example.test',
      token: 'local-token',
    });
    expect(
      readFileSync(join(directory, 'password-reset-mail.key'), 'utf8'),
    ).toHaveLength(64);
  });

  it('rejects malformed keys and unauthenticated queue ciphertext', () => {
    expect(
      () =>
        new PasswordResetCrypto(
          new ConfigService({ PASSWORD_RESET_MAIL_KEY: 'bad' }),
        ),
    ).toThrow();
    const crypto = new PasswordResetCrypto(
      new ConfigService({ PASSWORD_RESET_MAIL_KEY: 'ab'.repeat(32) }),
    );
    const encrypted = Buffer.from(
      crypto.encrypt({ email: 'local@example.test', token: 'local' }),
      'base64',
    );
    encrypted[30] ^= 1;
    expect(() => crypto.decrypt(encrypted.toString('base64'))).toThrow();
  });

  it('requires an explicit encryption key in production', () => {
    expect(
      () =>
        new PasswordResetCrypto(new ConfigService({ NODE_ENV: 'production' })),
    ).toThrow('PASSWORD_RESET_MAIL_KEY is required');
  });

  it('rejects local email mode and HTTP reset links in production', () => {
    expect(
      () =>
        new PasswordResetMailer(
          new ConfigService({
            NODE_ENV: 'production',
            PASSWORD_RESET_MAIL_MODE: 'local',
            FRONTEND_URL: 'https://toolhub.example',
          }),
        ),
    ).toThrow('Local mailbox is disabled');
    expect(
      () =>
        new PasswordResetMailer(
          new ConfigService({
            NODE_ENV: 'production',
            FRONTEND_URL: 'http://toolhub.example',
          }),
        ),
    ).toThrow('Invalid FRONTEND_URL');
  });

  it('requires complete SMTP configuration and uses verified TLS settings', () => {
    expect(
      () =>
        new PasswordResetMailer(
          new ConfigService({ PASSWORD_RESET_MAIL_MODE: 'smtp' }),
        ),
    ).toThrow('SMTP_HOST and SMTP_FROM');
    expect(
      () =>
        new PasswordResetMailer(
          new ConfigService({
            PASSWORD_RESET_MAIL_MODE: 'smtp',
            SMTP_HOST: 'smtp.example.test',
            SMTP_FROM: 'mail@example.test',
            SMTP_USER: 'mail@example.test',
          }),
        ),
    ).toThrow('SMTP credentials');
    const mailer = new PasswordResetMailer(
      new ConfigService({
        PASSWORD_RESET_MAIL_MODE: 'smtp',
        SMTP_HOST: 'smtp.example.test',
        SMTP_FROM: 'mail@example.test',
        SMTP_USER: 'mail@example.test',
        SMTP_PASSWORD: 'test-only',
        SMTP_SECURE: 'true',
      }),
    );
    mailer.onModuleDestroy();
  });
});
