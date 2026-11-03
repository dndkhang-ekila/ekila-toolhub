import { UrlPolicyModule } from './url-policy/url-policy.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { AccountModule } from './account/account.module';
import { TwoFactorAuthModule } from './two-factor-auth/two-factor-auth.module';
import { LinksModule } from './links/links.module';
import { DatabaseModule } from './database/database.module';
import { PasswordResetModule } from './password-reset/password-reset.module';

@Module({
  imports: [
    UrlPolicyModule,
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    AccountModule,
    TwoFactorAuthModule,
    LinksModule,
    PasswordResetModule,
  ],
})
export class AppModule {}
