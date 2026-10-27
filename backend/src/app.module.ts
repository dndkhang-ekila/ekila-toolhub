import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TwoFactorAuthModule } from './two-factor-auth/two-factor-auth.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), TwoFactorAuthModule],
})
export class AppModule {}
