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
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { CheckUrlSafetyDto } from './dto/check-url-safety.dto';
import { CreateAbuseReportDto } from './dto/create-abuse-report.dto';
import { CreateShortLinkDto } from './dto/create-short-link.dto';
import { UpdateAbuseReportDto } from './dto/update-abuse-report.dto';
import {
  AbuseReportRecord,
  AbuseReportStatus,
  AdminReportsQueryResult,
  CreateLinkResult,
  LinkRecord,
  SafetyCheckResult,
} from './links.types';
import { LinksService } from './services/links.service';
import { ReportsService } from './services/reports.service';
import { UrlSafetyService } from './services/url-safety.service';
import { parseClientIp } from './utils/links.utils';

@Controller('links')
export class LinksController {
  constructor(
    private readonly linksService: LinksService,
    private readonly reportsService: ReportsService,
    private readonly urlSafetyService: UrlSafetyService,
  ) {}

  @Post('report')
  @HttpCode(HttpStatus.OK)
  async submitReport(
    @Body() dto: CreateAbuseReportDto,
    @Req() req: Request,
  ): Promise<{ success: boolean; message: string; reportId: string }> {
    const ip = parseClientIp(
      req.headers['x-forwarded-for'],
      req.socket?.remoteAddress,
    );
    return this.reportsService.submitReport(dto, ip);
  }

  @Get('admin/reports')
  async getAdminReports(
    @Query('status') status?: AbuseReportStatus | 'ALL',
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<AdminReportsQueryResult> {
    return this.reportsService.getAdminQueue({
      status,
      search,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Get('admin/reports/:id')
  async getReportById(@Param('id') id: string): Promise<AbuseReportRecord> {
    return this.reportsService.getReportById(id);
  }

  @Patch('admin/reports/:id')
  async updateReport(
    @Param('id') id: string,
    @Body() dto: UpdateAbuseReportDto,
    @Headers('x-user-id') adminUserId?: string,
  ): Promise<AbuseReportRecord> {
    return this.reportsService.handleAdminAction(
      id,
      dto,
      adminUserId || 'admin_sys',
    );
  }

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
