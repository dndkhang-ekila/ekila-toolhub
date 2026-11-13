import { Module } from '@nestjs/common';
import { AdminReportsController } from './admin-reports.controller';
import { LinksController } from './links.controller';
import { LinksRepository } from './links.repository';
import { ReportsRepository } from './reports.repository';
import { LinksService } from './services/links.service';
import { ReportsService } from './services/reports.service';
import { UrlSafetyService } from './services/url-safety.service';

@Module({
  controllers: [LinksController, AdminReportsController],
  providers: [
    LinksService,
    ReportsService,
    UrlSafetyService,
    LinksRepository,
    ReportsRepository,
  ],
  exports: [
    LinksService,
    ReportsService,
    UrlSafetyService,
    LinksRepository,
    ReportsRepository,
  ],
})
export class LinksModule {}
