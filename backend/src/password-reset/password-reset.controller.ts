import {
  Body,
  Controller,
  Header,
  HttpCode,
  Post,
  Req,
  UseFilters,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  ForgotPasswordDto,
  ResetPasswordDto,
  ValidateResetTokenDto,
} from './dto/password-reset.dto';
import { PasswordResetErrorFilter } from './password-reset-error.filter';
import { PasswordResetService } from './password-reset.service';

@Controller('auth')
@UseFilters(PasswordResetErrorFilter)
export class PasswordResetController {
  constructor(private readonly service: PasswordResetService) {}

  @Post('forgot-password')
  @HttpCode(202)
  @Header('Cache-Control', 'no-store')
  @Header('Retry-After', '60')
  @Header('Access-Control-Expose-Headers', 'Retry-After')
  async forgot(@Body() body: ForgotPasswordDto, @Req() request: Request) {
    await this.service.forgot(
      body?.email,
      request.ip || request.socket.remoteAddress || 'unknown',
    );
    return {
      message:
        'Nếu tài khoản đủ điều kiện, liên kết khôi phục sẽ được gửi qua email.',
    };
  }

  @Post('reset-password/validate')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  async validate(@Body() body: ValidateResetTokenDto, @Req() request: Request) {
    await this.service.validate(
      body?.token,
      request.ip || request.socket.remoteAddress || 'unknown',
    );
    return { valid: true };
  }

  @Post('reset-password')
  @HttpCode(204)
  @Header('Cache-Control', 'no-store')
  async reset(
    @Body() body: ResetPasswordDto,
    @Req() request: Request,
  ): Promise<void> {
    await this.service.reset(
      body?.token,
      body?.newPassword,
      request.ip || request.socket.remoteAddress || 'unknown',
    );
  }
}
