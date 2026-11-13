import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { UpdateAbuseReportDto } from './dto/update-abuse-report.dto';
import {
  AbuseReportRecord,
  AbuseReportStatus,
  AdminReportsQueryResult,
} from './links.types';
import { ReportsService } from './services/reports.service';

@Controller('admin/reports')
export class AdminReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  async getReportsQueue(
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

  @Get(':id')
  async getReportDetail(@Param('id') id: string): Promise<AbuseReportRecord> {
    return this.reportsService.getReportById(id);
  }

  @Patch(':id')
  async handleReportAction(
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
}
