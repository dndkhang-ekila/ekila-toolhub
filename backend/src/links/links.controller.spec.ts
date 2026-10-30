import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import { LinksController } from './links.controller';
import { LinksService } from './services/links.service';
import { UrlSafetyService } from './services/url-safety.service';

describe('LinksController', () => {
  let controller: LinksController;
  let linksService: LinksService;
  let urlSafetyService: UrlSafetyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LinksController],
      providers: [
        {
          provide: LinksService,
          useValue: {
            createShortLink: jest.fn(),
            resolveRedirect: jest.fn(),
            getLinkDetails: jest.fn(),
            deleteLink: jest.fn(),
          },
        },
        {
          provide: UrlSafetyService,
          useValue: {
            checkUrlSafety: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<LinksController>(LinksController);
    linksService = module.get<LinksService>(LinksService);
    urlSafetyService = module.get<UrlSafetyService>(UrlSafetyService);
  });

  it('should call checkUrlSafety on check-safety endpoint', async () => {
    const mockResult = {
      isSafe: true as const,
      normalizedUrl: 'https://example.com',
      hostname: 'example.com',
    };
    const checkSpy = jest.spyOn(urlSafetyService, 'checkUrlSafety');
    checkSpy.mockResolvedValue(mockResult);

    const res = await controller.checkSafety({ url: 'https://example.com' });
    expect(res).toEqual(mockResult);
    expect(checkSpy).toHaveBeenCalledWith('https://example.com');
  });

  it('should call createShortLink with user id on post endpoint', async () => {
    const mockResult = {
      link: {
        id: '1',
        originalUrl: 'https://example.com',
        slug: 'abc1234',
        shortUrl: 'https://toolhub.id.vn/abc1234',
        isGuest: true,
        createdAt: new Date(),
        expiresAt: new Date(),
        clickCount: 0,
        uniqueDailyHashes: [],
        isActive: true,
      },
      isDuplicate: false,
    };
    const createSpy = jest.spyOn(linksService, 'createShortLink');
    createSpy.mockResolvedValue(mockResult);

    const res = await controller.createShortLink(
      { originalUrl: 'https://example.com' },
      'usr_123',
    );
    expect(res).toEqual(mockResult);
    expect(createSpy).toHaveBeenCalledWith(
      { originalUrl: 'https://example.com' },
      'usr_123',
    );
  });

  it('should redirect with 302 HTTP status on redirect endpoint', async () => {
    const redirectSpy = jest.spyOn(linksService, 'resolveRedirect');
    redirectSpy.mockResolvedValue('https://example.com/dest');

    const redirectFn = jest.fn();
    const mockResponse = {
      redirect: redirectFn,
    } as unknown as Response;

    await controller.redirect('abc1234', '1.2.3.4', mockResponse);

    expect(redirectSpy).toHaveBeenCalledWith('abc1234', '1.2.3.4');
    expect(redirectFn).toHaveBeenCalledWith(
      HttpStatus.FOUND,
      'https://example.com/dest',
    );
  });
});
