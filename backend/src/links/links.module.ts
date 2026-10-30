import { Module } from '@nestjs/common';
import { LinksController } from './links.controller';
import { LinksRepository } from './links.repository';
import { LinksService } from './services/links.service';
import { UrlSafetyService } from './services/url-safety.service';

@Module({
  controllers: [LinksController],
  providers: [LinksService, UrlSafetyService, LinksRepository],
  exports: [LinksService, UrlSafetyService, LinksRepository],
})
export class LinksModule {}
