import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AccountModule } from './account/account.module';
import { TwoFactorAuthModule } from './two-factor-auth/two-factor-auth.module';
import { UrlShortenerModule } from './url-shortener/url-shortener.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AccountModule,
    TwoFactorAuthModule,
    UrlShortenerModule,
  ],
})
export class AppModule {}
