import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { TwoFactorAuthService } from './two-factor-auth.service';
import { GenerateTwoFactorDto } from './dto/generate-2fa.dto';
import { EnableTwoFactorDto } from './dto/enable-2fa.dto';
import { VerifyTwoFactorDto } from './dto/verify-2fa.dto';
import { DisableTwoFactorDto } from './dto/disable-2fa.dto';
import {
  TwoFactorSetupResponse,
  TwoFactorStatusResponse,
  TwoFactorVerifyResult,
} from './two-factor-auth.types';

@Controller('auth/2fa')
export class TwoFactorAuthController {
  constructor(private readonly twoFactorService: TwoFactorAuthService) {}

  @Post('generate')
  @HttpCode(HttpStatus.OK)
  async generate(
    @Body() dto: GenerateTwoFactorDto,
  ): Promise<TwoFactorSetupResponse> {
    return this.twoFactorService.generate(dto);
  }

  @Post('enable')
  @HttpCode(HttpStatus.OK)
  async enable(
    @Body() dto: EnableTwoFactorDto,
  ): Promise<{ success: boolean; message: string }> {
    return this.twoFactorService.enable(dto);
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  async verify(
    @Body() dto: VerifyTwoFactorDto,
  ): Promise<TwoFactorVerifyResult> {
    return this.twoFactorService.verify(dto);
  }

  @Post('disable')
  @HttpCode(HttpStatus.OK)
  async disable(
    @Body() dto: DisableTwoFactorDto,
  ): Promise<{ success: boolean; message: string }> {
    return this.twoFactorService.disable(dto);
  }

  @Get('status/:userId')
  async getStatus(
    @Param('userId') userId: string,
  ): Promise<TwoFactorStatusResponse> {
    return this.twoFactorService.getStatus(userId);
  }
}
