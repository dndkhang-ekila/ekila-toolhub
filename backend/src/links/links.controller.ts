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
  Post,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { CheckUrlSafetyDto } from './dto/check-url-safety.dto';
import { CreateShortLinkDto } from './dto/create-short-link.dto';
import { CreateLinkResult, LinkRecord, SafetyCheckResult } from './links.types';
import { LinksService } from './services/links.service';
import { UrlSafetyService } from './services/url-safety.service';

@Controller('links')
export class LinksController {
  constructor(
    private readonly linksService: LinksService,
    private readonly urlSafetyService: UrlSafetyService,
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
    @Headers('x-user-id') userId?: string,
  ): Promise<CreateLinkResult> {
    return this.linksService.createShortLink(dto, userId);
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

  @Get(':slug')
  async getDetails(@Param('slug') slug: string): Promise<LinkRecord> {
    return this.linksService.getLinkDetails(slug);
  }

  @Delete(':slug')
  async deleteLink(
    @Param('slug') slug: string,
    @Headers('x-user-id') userId?: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.linksService.deleteLink(slug, userId);
  }
}
