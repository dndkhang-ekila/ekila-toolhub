import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { Server } from 'node:http';
import { UrlPolicyConfig } from './url-policy.config';
import { UrlPolicyError } from './url-policy.error';
import { UrlPolicyModule } from './url-policy.module';
import { UrlPolicyRateLimiter } from './url-policy.rate-limiter';
import { UrlPolicyService } from './url-policy.service';
import { UrlPolicyTransport } from './url-policy.transport';

describe('URL policy HTTP API', () => {
  let app: INestApplication;
  let server: Server;
  const inspect = jest.fn();

  beforeEach(async () => {
    inspect.mockReset().mockResolvedValue({ status: 200 });
    const module = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ ignoreEnvFile: true }), UrlPolicyModule],
    })
      .overrideProvider(UrlPolicyConfig)
      .useValue({
        toolhubDomains: ['toolhub.example'],
        shortenerDomains: ['bit.ly', 'tinyurl.com'],
        timeoutMs: 200,
        maxRedirects: 5,
        maxConcurrentChecks: 16,
      })
      .overrideProvider(UrlPolicyTransport)
      .useValue({ inspect })
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
    server = app.getHttpServer() as Server;
  });

  afterEach(async () => app.close());

  it('returns a checked approval and never caches the result', async () => {
    const result = await request(server)
      .post('/api/v1/url-policy/check')
      .send({ url: 'https://example.com/article' })
      .expect(200);
    expect(result.headers['cache-control']).toBe('no-store');
    expect(result.body).toMatchObject({
      allowed: true,
      normalizedUrl: 'https://example.com/article',
      redirectsChecked: 0,
    });
  });

  it('returns machine-readable blocked reasons', async () => {
    await request(server)
      .post('/api/v1/url-policy/check')
      .send({ url: 'https://bit.ly/abc' })
      .expect(422, { error: { code: 'SHORTENER_DOMAIN_NOT_ALLOWED' } });
    await request(server)
      .post('/api/v1/url-policy/check')
      .send({ url: 'https://go.toolhub.example/abc' })
      .expect(422, { error: { code: 'SELF_DOMAIN_NOT_ALLOWED' } });
    expect(inspect).not.toHaveBeenCalled();
  });

  it.each([
    {},
    { url: null },
    { url: 42 },
    { url: 'javascript:alert(1)' },
    { url: 'https://example.com/', allowed: true },
    { url: ['https://example.com/'] },
  ])('rejects invalid payload %p', async (body) => {
    await request(server)
      .post('/api/v1/url-policy/check')
      .send(body)
      .expect(400, { error: { code: 'INVALID_URL' } });
    expect(inspect).not.toHaveBeenCalled();
  });

  it('checks indirect destinations and reports the underlying reason', async () => {
    inspect.mockResolvedValueOnce({
      status: 302,
      location: 'https://bit.ly/abc',
    });
    await request(server)
      .post('/api/v1/url-policy/check')
      .send({ url: 'https://example.com/' })
      .expect(422, {
        error: {
          code: 'REDIRECT_TARGET_NOT_ALLOWED',
          reason: 'SHORTENER_DOMAIN_NOT_ALLOWED',
        },
      });
    expect(inspect).toHaveBeenCalledTimes(1);
  });

  it('rejects DNS-resolved private addresses after redirect', async () => {
    inspect
      .mockResolvedValueOnce({
        status: 302,
        location: 'https://other.example/',
      })
      .mockRejectedValueOnce(new UrlPolicyError('UNSAFE_URL_TARGET'));
    await request(server)
      .post('/api/v1/url-policy/check')
      .send({ url: 'https://example.com/' })
      .expect(422, {
        error: {
          code: 'REDIRECT_TARGET_NOT_ALLOWED',
          reason: 'UNSAFE_URL_TARGET',
        },
      });
  });

  it('does not return infrastructure details in network errors', async () => {
    inspect.mockRejectedValue(new Error('private details'));
    await request(server)
      .post('/api/v1/url-policy/check')
      .send({ url: 'https://example.com/' })
      .expect(503, { error: { code: 'URL_VERIFICATION_FAILED' } });
  });

  it('limits requests with Retry-After and does not trust spoofed forwarded IPs', async () => {
    for (let index = 0; index < 20; index++) {
      await request(server)
        .post('/api/v1/url-policy/check')
        .set('X-Forwarded-For', `8.8.8.${index}`)
        .send({ url: 'https://example.com/' })
        .expect(200);
    }
    const result = await request(server)
      .post('/api/v1/url-policy/check')
      .set('X-Forwarded-For', '1.1.1.1')
      .send({ url: 'https://example.com/' })
      .expect(429);
    expect(result.headers['retry-after']).toBe('60');
    expect(result.body).toEqual({ error: { code: 'RATE_LIMITED' } });
    expect(inspect).toHaveBeenCalledTimes(20);
  });

  it('exports enforcement for link creation and blocks before a write', async () => {
    const policy = app.get(UrlPolicyService);
    const write = jest.fn();
    const createLink = async (url: string) => {
      const approval = await policy.assertCanShorten(url);
      write(approval.normalizedUrl);
    };
    await expect(createLink('https://bit.ly/abc')).rejects.toBeInstanceOf(
      UrlPolicyError,
    );
    expect(write).not.toHaveBeenCalled();
    await createLink('https://example.com/');
    expect(write).toHaveBeenCalledWith('https://example.com/');
  });
});

describe('UrlPolicyRateLimiter', () => {
  it('resets expired buckets', () => {
    const limiter = new UrlPolicyRateLimiter();
    for (let count = 0; count < 20; count++) limiter.check('127.0.0.1', 1000);
    expect(() => limiter.check('127.0.0.1', 60999)).toThrow(UrlPolicyError);
    expect(() => limiter.check('127.0.0.1', 61000)).not.toThrow();
  });
});
