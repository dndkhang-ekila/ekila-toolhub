import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UrlPolicyConfig } from './url-policy.config';
import { UrlPolicyController } from './url-policy.controller';
import { UrlPolicyRateLimiter } from './url-policy.rate-limiter';
import { UrlPolicyService } from './url-policy.service';
import { UrlPolicyTransport } from './url-policy.transport';

@Module({
  imports: [ConfigModule],
  controllers: [UrlPolicyController],
  providers: [
    UrlPolicyConfig,
    UrlPolicyTransport,
    UrlPolicyService,
    UrlPolicyRateLimiter,
  ],
  exports: [UrlPolicyService],
})
export class UrlPolicyModule {}
