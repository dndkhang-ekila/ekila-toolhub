import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Redirect,
  Req,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UrlShortenerService } from './url-shortener.service';
import { CreateLinkDto } from './dto/create-link.dto';
import { UpdateLinkDto } from './dto/update-link.dto';

interface RawRequest {
  headers: Record<string, string | string[] | undefined>;
  socket?: { remoteAddress?: string };
}

@Controller('links')
export class UrlShortenerController {
  constructor(
    private readonly service: UrlShortenerService,
    private readonly config: ConfigService,
  ) {}

  @Get('r/:slug')
  @Redirect()
  handleRedirect(@Param('slug') slug: string, @Req() req: RawRequest) {
    const frontendUrl = this.config.get<string>(
      'FRONTEND_URL',
      'http://localhost:3000',
    );
    const ip =
      (req.headers['x-forwarded-for'] as string) ||
      req.socket?.remoteAddress ||
      '127.0.0.1';
    const userAgent = (req.headers['user-agent'] as string) || '';
    const referer = (req.headers['referer'] as string) || '';

    const result = this.service.resolveLinkAndTrack(slug, {
      ip,
      userAgent,
      referer,
    });

    if (result.status === 'SUCCESS') {
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
  resolveSlug(@Param('slug') slug: string, @Req() req: RawRequest) {
    const ip =
      (req.headers['x-forwarded-for'] as string) ||
      req.socket?.remoteAddress ||
      '127.0.0.1';
    const userAgent = (req.headers['user-agent'] as string) || '';
    const referer = (req.headers['referer'] as string) || '';

    return this.service.resolveLinkAndTrack(slug, { ip, userAgent, referer });
  }

  @Get()
  getLinks(
    @Headers('x-user-id') headerUserId: string | undefined,
    @Query('search') search?: string,
  ) {
    const userId = headerUserId || 'usr_demo_123';
    return this.service.getLinks(userId, search);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createLink(
    @Headers('x-user-id') headerUserId: string | undefined,
    @Body() dto: CreateLinkDto,
  ) {
    const userId = headerUserId || 'usr_demo_123';
    return this.service.createLink(userId, dto);
  }

  @Patch(':id')
  updateLink(
    @Param('id') id: string,
    @Headers('x-user-id') headerUserId: string | undefined,
    @Body() dto: UpdateLinkDto,
  ) {
    const userId = headerUserId || 'usr_demo_123';
    return this.service.updateLink(userId, id, dto);
  }

  @Delete(':id')
  deleteLink(
    @Param('id') id: string,
    @Headers('x-user-id') headerUserId: string | undefined,
  ) {
    const userId = headerUserId || 'usr_demo_123';
    return this.service.deleteLink(userId, id);
  }
}
