import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AccountModule } from './account/account.module';
import { TwoFactorAuthModule } from './two-factor-auth/two-factor-auth.module';
import { DatabaseModule } from './database/database.module';
import { PasswordResetModule } from './password-reset/password-reset.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AccountModule,
    TwoFactorAuthModule,
    PasswordResetModule,
  ],
})
export class AppModule {}
