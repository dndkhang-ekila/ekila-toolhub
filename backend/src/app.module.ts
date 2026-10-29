import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AccountModule } from './account/account.module';
import { TwoFactorAuthModule } from './two-factor-auth/two-factor-auth.module';
import { UrlPolicyModule } from './url-policy/url-policy.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AccountModule,
    TwoFactorAuthModule,
    UrlPolicyModule,
  ],
})
export class AppModule {}
