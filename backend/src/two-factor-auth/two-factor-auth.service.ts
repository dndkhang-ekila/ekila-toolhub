import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { TotpCryptoService } from './totp-crypto.service';
import { TwoFactorAuthRepository } from './two-factor-auth.repository';
import { GenerateTwoFactorDto } from './dto/generate-2fa.dto';
import { EnableTwoFactorDto } from './dto/enable-2fa.dto';
import { VerifyTwoFactorDto } from './dto/verify-2fa.dto';
import { DisableTwoFactorDto } from './dto/disable-2fa.dto';
import {
  TwoFactorSetupResponse,
  TwoFactorStatusResponse,
  TwoFactorVerifyResult,
} from './two-factor-auth.types';

@Injectable()
export class TwoFactorAuthService {
  private readonly issuer = 'ToolHub';

  constructor(
    private readonly cryptoService: TotpCryptoService,
    private readonly repository: TwoFactorAuthRepository,
  ) {}

  async generate(dto: GenerateTwoFactorDto): Promise<TwoFactorSetupResponse> {
    const existing = await this.repository.findByUserId(dto.userId);
    if (existing?.isEnabled) {
      throw new BadRequestException(
        'Two factor authentication is already enabled for this account',
      );
    }

    const secret = this.cryptoService.generateSecret(20);
    const accountName = dto.accountName ?? `${dto.userId}@toolhub.ekila.vn`;
    const otpauthUri = this.cryptoService.generateKeyUri(
      accountName,
      this.issuer,
      secret,
    );
    const qrCodeUrl = await this.cryptoService.generateQrCode(otpauthUri);
    const { plainCodes, hashedCodes } =
      this.cryptoService.generateBackupCodes(8);

    await this.repository.saveTempSecret(
      dto.userId,
      accountName,
      secret,
      hashedCodes,
    );

    return {
      secret,
      otpauthUri,
      qrCodeUrl,
      backupCodes: plainCodes,
    };
  }

  async enable(
    dto: EnableTwoFactorDto,
  ): Promise<{ success: boolean; message: string }> {
    const existing = await this.repository.findByUserId(dto.userId);
    if (!existing || !existing.tempSecret) {
      throw new BadRequestException(
        'No pending two factor setup found. Please generate credentials first.',
      );
    }

    const isValid = this.cryptoService.verifyTotp(
      dto.token,
      existing.tempSecret,
      1,
    );

    if (!isValid) {
      throw new UnauthorizedException('Invalid two factor verification code');
    }

    await this.repository.enable(dto.userId);

    return {
      success: true,
      message: 'Two factor authentication has been enabled successfully',
    };
  }

  async verify(dto: VerifyTwoFactorDto): Promise<TwoFactorVerifyResult> {
    const existing = await this.repository.findByUserId(dto.userId);
    if (!existing || !existing.isEnabled) {
      throw new BadRequestException(
        'Two factor authentication is not enabled for this user',
      );
    }

    const isBackupCheck =
      dto.isBackupCode === true ||
      dto.token.includes('-') ||
      dto.token.length > 6;

    if (isBackupCheck) {
      const codeHash = this.cryptoService.hashBackupCode(dto.token);
      const isMatched = existing.hashedBackupCodes.includes(codeHash);

      if (!isMatched) {
        throw new UnauthorizedException(
          'Invalid or already consumed backup code',
        );
      }

      const remaining = await this.repository.consumeBackupCode(
        dto.userId,
        codeHash,
      );

      return {
        verified: true,
        method: 'backup',
        remainingBackupCodes: remaining,
      };
    }

    const isValid = this.cryptoService.verifyTotp(
      dto.token,
      existing.secret,
      1,
    );
    if (!isValid) {
      throw new UnauthorizedException('Invalid two factor verification code');
    }

    return {
      verified: true,
      method: 'totp',
    };
  }

  async disable(
    dto: DisableTwoFactorDto,
  ): Promise<{ success: boolean; message: string }> {
    const existing = await this.repository.findByUserId(dto.userId);
    if (!existing || !existing.isEnabled) {
      throw new BadRequestException(
        'Two factor authentication is not enabled for this user',
      );
    }

    const isTotpValid = this.cryptoService.verifyTotp(
      dto.token,
      existing.secret,
      1,
    );

    const isBackupValid =
      !isTotpValid &&
      existing.hashedBackupCodes.includes(
        this.cryptoService.hashBackupCode(dto.token),
      );

    if (!isTotpValid && !isBackupValid) {
      throw new UnauthorizedException(
        'Invalid authentication token to disable 2FA',
      );
    }

    await this.repository.disable(dto.userId);

    return {
      success: true,
      message: 'Two factor authentication has been disabled successfully',
    };
  }

  async getStatus(userId: string): Promise<TwoFactorStatusResponse> {
    const existing = await this.repository.findByUserId(userId);
    return {
      userId,
      isEnabled: existing?.isEnabled ?? false,
      remainingBackupCodes: existing?.hashedBackupCodes.length ?? 0,
    };
  }
}
