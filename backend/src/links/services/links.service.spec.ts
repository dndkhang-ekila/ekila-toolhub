import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { LinksRepository } from '../links.repository';
import { LinksService } from './links.service';
import { UrlSafetyService } from './url-safety.service';

describe('LinksService', () => {
  let service: LinksService;
  let repository: LinksRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LinksService,
        LinksRepository,
        UrlSafetyService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'APP_URL' || key === 'FRONTEND_URL') {
                return 'https://toolhub.id.vn';
              }
              if (key === 'IP_HASH_SECRET') {
                return 'test-secret';
              }
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<LinksService>(LinksService);
    repository = module.get<LinksRepository>(LinksRepository);
  });

  afterEach(async () => {
    await repository.clear();
  });

  it('Given destination URL in blocklist, When shortening requested, Then rejects and does not create link', async () => {
    const initialCount = await repository.count();
    expect(initialCount).toBe(0);

    await expect(
      service.createShortLink({
        originalUrl: 'https://phishing-bank-login.com/secure',
      }),
    ).rejects.toThrow(UnprocessableEntityException);

    const countAfter = await repository.count();
    expect(countAfter).toBe(0);
  });

  it('Given destination URL with malware, When shortening requested, Then rejects with threat reason and does not create link', async () => {
    await expect(
      service.createShortLink({
        originalUrl: 'https://malware-test.com/payload.exe',
      }),
    ).rejects.toThrow(UnprocessableEntityException);

    const countAfter = await repository.count();
    expect(countAfter).toBe(0);
  });

  it('Given safe destination URL, When shortening requested, Then creates short link with QR code readiness and 30-day expiry', async () => {
    const result = await service.createShortLink({
      originalUrl: 'https://example.com/clean-article',
    });

    expect(result.link).toBeDefined();
    expect(result.link.shortUrl).toContain('https://toolhub.id.vn/');
    expect(result.link.isGuest).toBe(true);
    expect(result.isDuplicate).toBe(false);

    const stored = await repository.findBySlug(result.link.slug);
    expect(stored).not.toBeNull();
    expect(stored?.originalUrl).toBe('https://example.com/clean-article');

    const expectedExpiry = new Date(
      result.link.createdAt.getTime() + 30 * 24 * 60 * 60 * 1000,
    );
    expect(
      Math.abs(result.link.expiresAt.getTime() - expectedExpiry.getTime()),
    ).toBeLessThan(1000);
  });

  it('complies with BR-URL-02: prompts user when shortening the same URL repeatedly', async () => {
    const firstResult = await service.createShortLink({
      originalUrl: 'https://github.com/dndkhang-ekila/ekila-toolhub',
    });
    expect(firstResult.isDuplicate).toBe(false);

    const secondResult = await service.createShortLink({
      originalUrl: 'https://github.com/dndkhang-ekila/ekila-toolhub',
    });
    expect(secondResult.isDuplicate).toBe(true);
    expect(secondResult.link.slug).toBe(firstResult.link.slug);

    const forceNewResult = await service.createShortLink({
      originalUrl: 'https://github.com/dndkhang-ekila/ekila-toolhub',
      forceNew: true,
    });
    expect(forceNewResult.isDuplicate).toBe(false);
    expect(forceNewResult.link.slug).not.toBe(firstResult.link.slug);
  });

  it('complies with BR-URL-01: guest links cannot be deleted', async () => {
    const created = await service.createShortLink({
      originalUrl: 'https://example.com/guest-link',
    });
    expect(created.link.isGuest).toBe(true);

    await expect(service.deleteLink(created.link.slug)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('complies with BR-URL-03: clicks are recorded with daily hashed IP and no raw IP is retained', async () => {
    const created = await service.createShortLink({
      originalUrl: 'https://example.com/target-redirect',
    });

    const target = await service.resolveRedirect(
      created.link.slug,
      '203.0.113.195',
    );
    expect(target).toBe('https://example.com/target-redirect');

    const record = await service.getLinkDetails(created.link.slug);
    expect(record.clickCount).toBe(1);
    expect(record.uniqueDailyHashes.length).toBe(1);
    expect(record.uniqueDailyHashes[0]).not.toContain('203.0.113.195');
    expect(record.uniqueDailyHashes[0]).toMatch(/^[a-f0-9]{64}$/);
  });

  it('supports custom slug and enforces uniqueness', async () => {
    const created = await service.createShortLink({
      originalUrl: 'https://example.com/custom',
      customSlug: 'my-custom-slug',
    });
    expect(created.link.slug).toBe('my-custom-slug');

    await expect(
      service.createShortLink({
        originalUrl: 'https://example.com/other',
        customSlug: 'my-custom-slug',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('throws NotFoundException when redirecting non-existent slug', async () => {
    await expect(service.resolveRedirect('non-existent-slug')).rejects.toThrow(
      NotFoundException,
    );
  });
});
