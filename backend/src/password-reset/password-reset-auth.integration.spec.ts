import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Server } from 'node:http';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../app.module';
import { MailerService } from '../auth/mailer.service';
import { User } from '../auth/entities/user.entity';
import { databaseOptions } from '../database/database.options';
import { PasswordResetMailer } from './password-reset-mailer';
import { PasswordResetWorker } from './password-reset.worker';

describe('Auth and password reset share the application DataSource', () => {
  let app: INestApplication;
  let directory: string;
  const verification = jest.fn<Promise<boolean>, [string, string, string]>();
  const resetMail = jest.fn<Promise<void>, [string, string, string, Date]>();

  beforeEach(async () => {
    directory = mkdtempSync(join(tmpdir(), 'toolhub-auth-reset-'));
    const filename = join(directory, 'test.sqlite');
    const setup = new DataSource(databaseOptions(filename));
    await setup.initialize();
    await setup.runMigrations();
    await setup.destroy();
    verification.mockReset().mockResolvedValue(true);
    resetMail.mockReset().mockResolvedValue(undefined);
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(ConfigService)
      .useValue(
        new ConfigService({
          DATABASE_PATH: filename,
          PASSWORD_RESET_WORKER_ENABLED: 'false',
          PASSWORD_RESET_MAIL_MODE: 'local',
          PASSWORD_RESET_MAIL_KEY: 'ab'.repeat(32),
          FRONTEND_URL: 'http://localhost:3000',
          JWT_SECRET: 'isolated-test-key-for-auth-reset-integration-only',
        }),
      )
      .overrideProvider(MailerService)
      .useValue({ sendVerificationEmail: verification })
      .overrideProvider(PasswordResetMailer)
      .useValue({ send: resetMail })
      .compile();
    app = module.createNestApplication({ logger: false });
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app?.close();
    rmSync(directory, { recursive: true, force: true });
  });

  it('keeps register/login working and resets the same User with session revocation', async () => {
    const server = app.getHttpServer() as Server;
    const email = 'integration@example.test';
    const password = 'Before@Test2026';
    const nextPassword = 'After@Test2026';
    await request(server)
      .post('/api/v1/auth/register')
      .send({ email, password })
      .expect(201);
    expect(verification).toHaveBeenCalledTimes(1);
    await request(server)
      .post('/api/v1/auth/verify-email')
      .send({ email, code: verification.mock.calls[0][1] })
      .expect(200);
    const loggedIn = await request(server)
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(200);
    const oldToken = (loggedIn.body as { tokens: { accessToken: string } })
      .tokens.accessToken;
    await request(server)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer ' + oldToken)
      .expect(200);
    const source = app.get(DataSource);
    const before = await source.getRepository(User).findOneByOrFail({ email });
    await request(server)
      .post('/api/v1/auth/forgot-password')
      .send({ email })
      .expect(202);
    await app.get(PasswordResetWorker).drain();
    expect(resetMail).toHaveBeenCalledTimes(1);
    const token = resetMail.mock.calls[0][2];
    await request(server)
      .post('/api/v1/auth/reset-password')
      .send({ token, newPassword: nextPassword })
      .expect(204);
    const after = await source.getRepository(User).findOneByOrFail({ email });
    expect(after.id).toBe(before.id);
    expect(after.tokenVersion).toBe(before.tokenVersion + 1);
    await request(server)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer ' + oldToken)
      .expect(401);
    await request(server)
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(401);
    await request(server)
      .post('/api/v1/auth/login')
      .send({ email, password: nextPassword })
      .expect(200);
    await request(server)
      .post('/api/v1/auth/reset-password/validate')
      .send({ token })
      .expect(400);
  });
});
