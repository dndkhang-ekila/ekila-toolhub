import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Ip,
  Param,
  Patch,
  Post,
  Query,
  Redirect,
  Req,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { CheckUrlSafetyDto } from './dto/check-url-safety.dto';
import { CreateShortLinkDto } from './dto/create-short-link.dto';
import { UpdateShortLinkDto } from './dto/update-short-link.dto';
import {
  CreateLinkResult,
  LinkRecord,
  ResolveLinkResult,
  SafetyCheckResult,
} from './links.types';
import { LinksService } from './services/links.service';
import { UrlSafetyService } from './services/url-safety.service';
import { parseClientIp } from './utils/links.utils';

@Controller('links')
export class LinksController {
  constructor(
    private readonly linksService: LinksService,
    private readonly urlSafetyService: UrlSafetyService,
    private readonly configService: ConfigService,
  ) {}

  @Post('check-safety')
  @HttpCode(HttpStatus.OK)
  async checkSafety(
    @Body() dto: CheckUrlSafetyDto,
  ): Promise<SafetyCheckResult> {
    return this.urlSafetyService.checkUrlSafety(dto.url);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createShortLink(
    @Body() dto: CreateShortLinkDto,
    @Headers('x-user-id') headerUserId?: string,
  ): Promise<CreateLinkResult> {
    const userId = headerUserId || undefined;
    return this.linksService.createShortLink(dto, userId);
  }

  @Get()
  async getLinks(
    @Headers('x-user-id') headerUserId?: string,
    @Query('search') search?: string,
  ): Promise<LinkRecord[]> {
    const userId = headerUserId || 'usr_demo_123';
    return this.linksService.getLinks(userId, search);
  }

  @Get('r/:slug')
  @Redirect()
  async handleRedirect(
    @Param('slug') slug: string,
    @Req() req: Request,
  ): Promise<{ url: string; statusCode: number }> {
    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:3000',
    );
    const ip = parseClientIp(req.headers['x-forwarded-for'], req.socket?.remoteAddress);
    const userAgent = (req.headers['user-agent'] as string) || '';
    const referer = (req.headers['referer'] as string) || '';

    const result = await this.linksService.resolveLinkAndTrack(slug, {
      ip,
      userAgent,
      referer,
    });

    if (result.status === 'SUCCESS' && result.originalUrl) {
      return {
        url: result.originalUrl,
        statusCode: HttpStatus.FOUND,
      };
    }

    const noticeUrl = `${frontendUrl}/links/notice?slug=${encodeURIComponent(slug)}&status=${result.status.toLowerCase()}`;
    return {
      url: noticeUrl,
      statusCode: HttpStatus.FOUND,
    };
  }

  @Get('resolve/:slug')
  async resolveSlug(
    @Param('slug') slug: string,
    @Req() req: Request,
  ): Promise<ResolveLinkResult> {
    const ip = parseClientIp(req.headers['x-forwarded-for'], req.socket?.remoteAddress);
    const userAgent = (req.headers['user-agent'] as string) || '';
    const referer = (req.headers['referer'] as string) || '';

    return this.linksService.resolveLinkAndTrack(slug, {
      ip,
      userAgent,
      referer,
    });
  }

  @Get('redirect/:slug')
  async redirect(
    @Param('slug') slug: string,
    @Ip() clientIp: string,
    @Res() res: Response,
  ): Promise<void> {
    const destination = await this.linksService.resolveRedirect(slug, clientIp);
    res.redirect(HttpStatus.FOUND, destination);
  }

  @Patch(':id')
  async updateLink(
    @Param('id') id: string,
    @Headers('x-user-id') headerUserId: string | undefined,
    @Body() dto: UpdateShortLinkDto,
  ): Promise<LinkRecord> {
    const userId = headerUserId || 'usr_demo_123';
    return this.linksService.updateLink(userId, id, dto);
  }

  @Get(':slug')
  async getDetails(@Param('slug') slug: string): Promise<LinkRecord> {
    return this.linksService.getLinkDetails(slug);
  }

  @Delete(':slug')
  async deleteLink(
    @Param('slug') slug: string,
    @Headers('x-user-id') userId?: string,
  ): Promise<{ success: boolean; message: string }> {
    const actualUser = userId || 'usr_demo_123';
    const isId = slug.startsWith('lnk_');
    if (isId) {
      return this.linksService.deleteLinkById(actualUser, slug);
    }
    return this.linksService.deleteLink(slug, actualUser);
  }
}
