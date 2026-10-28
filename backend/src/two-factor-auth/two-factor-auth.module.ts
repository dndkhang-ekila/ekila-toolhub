import { Module } from '@nestjs/common';
import { TwoFactorAuthController } from './two-factor-auth.controller';
import { TwoFactorAuthService } from './two-factor-auth.service';
import { TotpCryptoService } from './totp-crypto.service';
import { TwoFactorAuthRepository } from './two-factor-auth.repository';

@Module({
  controllers: [TwoFactorAuthController],
  providers: [TwoFactorAuthService, TotpCryptoService, TwoFactorAuthRepository],
  exports: [TwoFactorAuthService, TotpCryptoService, TwoFactorAuthRepository],
})
export class TwoFactorAuthModule {}
