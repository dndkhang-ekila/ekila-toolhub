import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { INestApplication, Logger, ValidationPipe } from '@nestjs/common';
import { DataSource } from 'typeorm';
import request from 'supertest';
import * as bcrypt from 'bcryptjs';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { randomBytes } from 'node:crypto';
import { User } from '../auth/entities/user.entity';
import { databaseOptions } from '../database/database.options';
import { ResetSchema1793145600000 } from '../database/reset-schema.migration';
import { PasswordResetModule } from './password-reset.module';
import { PasswordResetClock } from './password-reset.clock';
import { PasswordResetWorker } from './password-reset.worker';
import { PasswordResetMailer } from './password-reset-mailer';
import { PasswordResetCrypto } from './password-reset.crypto';
import {
  PasswordResetRepository,
  RESET_TTL_MS,
} from './password-reset.repository';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { PasswordResetMailJob } from './entities/password-reset-mail-job.entity';

interface LocalMail {
  to: string;
  link: string;
  expiresAt: string;
}

describe('FR-ACC-03 with real SQLite and local email', () => {
  let app: INestApplication;
  let source: DataSource;
  let directory: string;
  let mailbox: string;
  let user: User;
  let now: Date;
  let worker: PasswordResetWorker;

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'fr-acc-03-test-'));
    mailbox = join(directory, 'mailbox');
    now = new Date('2026-10-28T05:00:00.000Z');
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [
            () => ({
              NODE_ENV: 'test',
              PASSWORD_RESET_MAIL_KEY: 'ab'.repeat(32),
              PASSWORD_RESET_MAIL_MODE: 'local',
              PASSWORD_RESET_MAIL_DIR: mailbox,
              PASSWORD_RESET_WORKER_ENABLED: 'false',
              FRONTEND_URL: 'http://localhost:3000',
            }),
          ],
        }),
        TypeOrmModule.forRoot(databaseOptions(join(directory, 'test.sqlite'))),
        PasswordResetModule,
      ],
    }).compile();
    app = module.createNestApplication({ logger: false });
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.enableCors({ origin: 'http://localhost:3000', credentials: true });
    source = app.get(DataSource);
    await source.runMigrations();
    jest
      .spyOn(app.get(PasswordResetClock), 'now')
      .mockImplementation(() => new Date(now));
    worker = app.get(PasswordResetWorker);
    await app.init();
    user = await source.getRepository(User).save({
      email: 'dat@example.test',
      passwordHash: await bcrypt.hash('OldPassword#123', 4),
      isEmailVerified: true,
      name: 'Local test',
      locale: 'vi',
      role: 'free',
      plan: 'free',
      tokenVersion: 3,
    });
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await app?.close();
    const target = resolve(directory);
    if (
      dirname(target) !== resolve(tmpdir()) ||
      !basename(target).startsWith('fr-acc-03-test-')
    ) {
      throw new Error('Refusing to clean an unexpected test directory');
    }
    await rm(target, { recursive: true, force: true });
  });

  const http = () =>
    request(app.getHttpServer() as Parameters<typeof request>[0]);

  async function issue(): Promise<{ token: string; mail: LocalMail }> {
    await http()
      .post('/api/v1/auth/forgot-password')
      .send({ email: user.email })
      .expect(202);
    await worker.drain();
    const files = await readdir(mailbox);
    const messages = await Promise.all(
      files.map(
        async (file) =>
          JSON.parse(await readFile(join(mailbox, file), 'utf8')) as LocalMail,
      ),
    );
    const mail = messages.sort((a, b) =>
      b.expiresAt.localeCompare(a.expiresAt),
    )[0];
    return { token: new URL(mail.link).searchParams.get('token')!, mail };
  }

  it('normalizes email and returns the same acceptance for known and unknown accounts', async () => {
    const known = await http()
      .post('/api/v1/auth/forgot-password')
      .set('Origin', 'http://localhost:3000')
      .send({ email: ' DAT@EXAMPLE.TEST ' })
      .expect(202);
    const unknown = await http()
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'absent@example.test' })
      .expect(202);
    expect(known.body).toEqual(unknown.body);
    expect(known.headers['retry-after']).toBe('60');
    expect(known.headers['cache-control']).toBe('no-store');
    expect(known.headers['access-control-expose-headers']).toBe('Retry-After');
    expect(known.headers['access-control-allow-origin']).toBe(
      'http://localhost:3000',
    );
    await worker.drain();
    expect(await source.getRepository(PasswordResetToken).count()).toBe(1);
    expect(
      await source
        .getRepository(PasswordResetMailJob)
        .countBy({ status: 'skipped' }),
    ).toBe(1);
  });

  it('keeps raw tokens and email out of the durable mail payload', async () => {
    const before = { ...user };
    await http()
      .post('/api/v1/auth/forgot-password')
      .send({ email: user.email })
      .expect(202);
    const job = (await source.getRepository(PasswordResetMailJob).find())[0];
    const crypto = app.get(PasswordResetCrypto);
    const payload = crypto.decrypt(job.encryptedPayload!);
    expect(job.encryptedPayload).not.toContain(user.email);
    expect(job.encryptedPayload).not.toContain(payload.token);
    await worker.drain();
    const record = (await source.getRepository(PasswordResetToken).find())[0];
    expect(record.tokenHash).toBe(crypto.hash(payload.token));
    expect(record.tokenHash).not.toBe(payload.token);
    expect(record.expiresAt.getTime() - record.createdAt.getTime()).toBe(
      RESET_TTL_MS,
    );
    expect(
      (await source.getRepository(PasswordResetMailJob).find())[0]
        .encryptedPayload,
    ).toBeNull();
    expect(
      await source.getRepository(User).findOneByOrFail({ id: user.id }),
    ).toEqual(before);
  });

  it('validates without consuming, resets once, preserves profile and increments tokenVersion', async () => {
    const { token } = await issue();
    for (let i = 0; i < 2; i++) {
      const response = await http()
        .post('/api/v1/auth/reset-password/validate')
        .send({ token })
        .expect(200);
      expect(response.body).toEqual({ valid: true });
    }
    const response = await http()
      .post('/api/v1/auth/reset-password')
      .send({ token, newPassword: 'NewPassword#123' })
      .expect(204);
    expect(response.text).toBe('');
    const updated = await source
      .getRepository(User)
      .findOneByOrFail({ id: user.id });
    expect(await bcrypt.compare('NewPassword#123', updated.passwordHash!)).toBe(
      true,
    );
    expect(await bcrypt.compare('OldPassword#123', updated.passwordHash!)).toBe(
      false,
    );
    expect(bcrypt.getRounds(updated.passwordHash!)).toBe(10);
    expect(updated.tokenVersion).toBe(4);
    expect(updated.email).toBe(user.email);
    expect(updated.name).toBe(user.name);
    expect(updated.isEmailVerified).toBe(true);
    await http()
      .post('/api/v1/auth/reset-password')
      .send({ token, newPassword: 'AnotherPassword#1' })
      .expect(400);
    await http()
      .post('/api/v1/auth/reset-password/validate')
      .send({ token })
      .expect(400);
  });

  it('rejects a token exactly at the 30 minute boundary', async () => {
    const { token } = await issue();
    now = new Date(now.getTime() + RESET_TTL_MS - 1);
    await http()
      .post('/api/v1/auth/reset-password/validate')
      .send({ token })
      .expect(200);
    now = new Date(now.getTime() + 1);
    const response = await http()
      .post('/api/v1/auth/reset-password/validate')
      .send({ token })
      .expect(400);
    expect(response.body).toEqual({ error: { code: 'RESET_LINK_INVALID' } });
    await http()
      .post('/api/v1/auth/reset-password')
      .send({ token, newPassword: 'NewPassword#123' })
      .expect(400);
  });

  it('rechecks expiry after password hashing before updating the account', async () => {
    const { token } = await issue();
    const repository = app.get(PasswordResetRepository);
    const original = repository.consume.bind(repository);
    jest
      .spyOn(repository, 'consume')
      .mockImplementation((hash, password, clock) => {
        now = new Date(now.getTime() + RESET_TTL_MS);
        return original(hash, password, clock);
      });
    await http()
      .post('/api/v1/auth/reset-password')
      .send({ token, newPassword: 'NewPassword#123' })
      .expect(400);
    expect(
      (await source.getRepository(User).findOneByOrFail({ id: user.id }))
        .passwordHash,
    ).toBe(user.passwordHash);
  });

  it('revokes the old link on a new eligible request', async () => {
    const first = await issue();
    now = new Date(now.getTime() + 60_000);
    const second = await issue();
    await http()
      .post('/api/v1/auth/reset-password/validate')
      .send({ token: first.token })
      .expect(400);
    await http()
      .post('/api/v1/auth/reset-password/validate')
      .send({ token: second.token })
      .expect(200);
  });

  it('allows only one of two concurrent reset submissions', async () => {
    const { token } = await issue();
    const results = await Promise.all([
      http()
        .post('/api/v1/auth/reset-password')
        .send({ token, newPassword: 'Concurrent#123A' }),
      http()
        .post('/api/v1/auth/reset-password')
        .send({ token, newPassword: 'Concurrent#123B' }),
    ]);
    expect(results.map((result) => result.status).sort()).toEqual([204, 400]);
    const updated = await source
      .getRepository(User)
      .findOneByOrFail({ id: user.id });
    expect(updated.tokenVersion).toBe(4);
    const matches = await Promise.all(
      ['Concurrent#123A', 'Concurrent#123B'].map((value) =>
        bcrypt.compare(value, updated.passwordHash!),
      ),
    );
    expect(matches.filter(Boolean)).toHaveLength(1);
  });

  it('rolls back both token consumption and password when the account update fails', async () => {
    const { token } = await issue();
    await source.query(
      "CREATE TRIGGER reject_reset BEFORE UPDATE OF passwordHash ON users BEGIN SELECT RAISE(ABORT, 'blocked'); END",
    );
    await http()
      .post('/api/v1/auth/reset-password')
      .send({ token, newPassword: 'NewPassword#123' })
      .expect(503);
    expect(
      (await source.getRepository(PasswordResetToken).find())[0].usedAt,
    ).toBeNull();
    expect(
      (await source.getRepository(User).findOneByOrFail({ id: user.id }))
        .passwordHash,
    ).toBe(user.passwordHash);
    await source.query('DROP TRIGGER reject_reset');
    await http()
      .post('/api/v1/auth/reset-password')
      .send({ token, newPassword: 'NewPassword#123' })
      .expect(204);
  });

  it('rejects Google-only and unverified users without disclosing them in the acceptance', async () => {
    await source.getRepository(User).save([
      {
        email: 'google@example.test',
        passwordHash: null,
        googleId: 'google-test',
        isEmailVerified: true,
      },
      {
        email: 'unverified@example.test',
        passwordHash: user.passwordHash,
        isEmailVerified: false,
      },
    ]);
    for (const email of [
      'google@example.test',
      'unverified@example.test',
      'absent@example.test',
    ]) {
      await http()
        .post('/api/v1/auth/forgot-password')
        .send({ email })
        .expect(202);
    }
    await worker.drain();
    expect(await source.getRepository(PasswordResetToken).count()).toBe(0);
  });

  it('rejects a link if the account is deleted or loses eligibility', async () => {
    const { token } = await issue();
    await source
      .getRepository(User)
      .update(user.id, { isEmailVerified: false });
    await http()
      .post('/api/v1/auth/reset-password/validate')
      .send({ token })
      .expect(400);
    await source.getRepository(User).delete(user.id);
    expect(await source.getRepository(PasswordResetToken).count()).toBe(0);
    await http()
      .post('/api/v1/auth/reset-password')
      .send({ token, newPassword: 'NewPassword#123' })
      .expect(400);
  });

  it.each([
    'weak',
    'NoNumber#',
    'NOLOWER1#',
    'noupper1#',
    'NoSymbol123',
    'Aa1#' + 'é'.repeat(35),
  ])(
    'rejects invalid password policy without consuming the token: %s',
    async (password) => {
      const { token } = await issue();
      const response = await http()
        .post('/api/v1/auth/reset-password')
        .send({ token, newPassword: password })
        .expect(422);
      expect(response.body).toEqual({
        error: { code: 'PASSWORD_POLICY_VIOLATION' },
      });
      expect(
        (await source.getRepository(PasswordResetToken).find())[0].usedAt,
      ).toBeNull();
    },
  );

  it('rejects malformed input and unknown tokens with safe error codes', async () => {
    const invalid = await http()
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'bad' })
      .expect(400);
    expect(invalid.body).toEqual({ error: { code: 'INVALID_EMAIL' } });
    await http()
      .post('/api/v1/auth/reset-password/validate')
      .send({})
      .expect(400);
    await http()
      .post('/api/v1/auth/reset-password/validate')
      .send({ token: randomBytes(32).toString('base64url') })
      .expect(400);
    await http()
      .post('/api/v1/auth/forgot-password')
      .send({ email: user.email, passwordHash: 'injected' })
      .expect(400);
  });

  it('applies resend cooldown equally to existing and absent accounts', async () => {
    for (const email of [user.email, 'missing@example.test']) {
      await http()
        .post('/api/v1/auth/forgot-password')
        .send({ email })
        .expect(202);
      const limited = await http()
        .post('/api/v1/auth/forgot-password')
        .send({ email })
        .expect(429);
      expect(limited.body).toEqual({ error: { code: 'RATE_LIMITED' } });
      expect(limited.headers['retry-after']).toBe('60');
    }
    now = new Date(now.getTime() + 60_000);
    await http()
      .post('/api/v1/auth/forgot-password')
      .send({ email: user.email })
      .expect(202);
  });

  it('limits token attempts and does not trust forwarded IP headers by default', async () => {
    const token = randomBytes(32).toString('base64url');
    for (let i = 0; i < 10; i++) {
      await http()
        .post('/api/v1/auth/reset-password/validate')
        .set('X-Forwarded-For', `192.0.2.${i}`)
        .send({ token })
        .expect(400);
    }
    await http()
      .post('/api/v1/auth/reset-password/validate')
      .send({ token })
      .expect(429);
  });

  it('retries a failed delivery durably without changing the token or its expiration', async () => {
    const mailer = app.get(PasswordResetMailer);
    const send = jest
      .spyOn(mailer, 'send')
      .mockRejectedValueOnce(new Error('sensitive provider response'));
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    await http()
      .post('/api/v1/auth/forgot-password')
      .send({ email: user.email })
      .expect(202);
    await worker.drain();
    const original = (await source.getRepository(PasswordResetToken).find())[0];
    expect(
      (await source.getRepository(PasswordResetMailJob).find())[0].status,
    ).toBe('pending');
    now = new Date(now.getTime() + 10_000);
    await worker.drain();
    const record = (await source.getRepository(PasswordResetToken).find())[0];
    expect(record.id).toBe(original.id);
    expect(record.expiresAt).toEqual(original.expiresAt);
    expect(send).toHaveBeenCalledTimes(2);
    expect(
      (await source.getRepository(PasswordResetMailJob).find())[0].status,
    ).toBe('sent');
  });

  it('recovers a leased job after a worker interruption', async () => {
    await http()
      .post('/api/v1/auth/forgot-password')
      .send({ email: user.email })
      .expect(202);
    const repository = app.get(PasswordResetRepository);
    const leased = await repository.claimMail(now);
    expect(leased?.status).toBe('processing');
    now = new Date(now.getTime() + 120_001);
    await worker.drain();
    expect(
      (await source.getRepository(PasswordResetMailJob).find())[0].status,
    ).toBe('sent');
  });

  it('keeps password and consumed token state when the database is reopened', async () => {
    const { token } = await issue();
    await http()
      .post('/api/v1/auth/reset-password')
      .send({ token, newPassword: 'Persisted#123' })
      .expect(204);
    const reopened = new DataSource(
      databaseOptions(join(directory, 'test.sqlite')),
    );
    await reopened.initialize();
    try {
      const saved = await reopened
        .getRepository(User)
        .findOneByOrFail({ id: user.id });
      expect(await bcrypt.compare('Persisted#123', saved.passwordHash!)).toBe(
        true,
      );
      expect(
        (await reopened.getRepository(PasswordResetToken).find())[0].usedAt,
      ).not.toBeNull();
      expect(saved.tokenVersion).toBe(4);
    } finally {
      await reopened.destroy();
    }
  });

  it('never alters an existing users table while migrating reset tables', async () => {
    const schema = await source.query<{ sql: string }[]>(
      "SELECT sql FROM sqlite_master WHERE name = 'users'",
    );
    const runner = source.createQueryRunner();
    await new ResetSchema1793145600000().up(runner);
    const after = await source.query<{ sql: string }[]>(
      "SELECT sql FROM sqlite_master WHERE name = 'users'",
    );
    expect(after).toEqual(schema);
    expect(await source.getRepository(User).count()).toBe(1);
    await runner.release();
  });

  it('refuses an incompatible users schema instead of modifying it', async () => {
    const separate = new DataSource(
      databaseOptions(join(directory, 'incompatible.sqlite')),
    );
    await separate.initialize();
    try {
      await separate.query(
        'CREATE TABLE users (id varchar PRIMARY KEY, email varchar)',
      );
      const before = await separate.query<{ sql: string }[]>(
        "SELECT sql FROM sqlite_master WHERE name = 'users'",
      );
      await expect(
        new ResetSchema1793145600000().up(separate.createQueryRunner()),
      ).rejects.toThrow('no user columns were changed');
      expect(
        await separate.query<{ sql: string }[]>(
          "SELECT sql FROM sqlite_master WHERE name = 'users'",
        ),
      ).toEqual(before);
    } finally {
      await separate.destroy();
    }
  });
});
