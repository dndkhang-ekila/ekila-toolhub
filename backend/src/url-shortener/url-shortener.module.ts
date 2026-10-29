import { Module } from '@nestjs/common';
import { UrlShortenerController } from './url-shortener.controller';
import { UrlShortenerService } from './url-shortener.service';
import { UrlShortenerRepository } from './url-shortener.repository';

@Module({
  controllers: [UrlShortenerController],
  providers: [UrlShortenerService, UrlShortenerRepository],
  exports: [UrlShortenerService, UrlShortenerRepository],
})
export class UrlShortenerModule {}
