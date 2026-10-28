import { Allow } from 'class-validator';

export class ForgotPasswordDto {
  @Allow()
  email?: unknown;
}

export class ValidateResetTokenDto {
  @Allow()
  token?: unknown;
}

export class ResetPasswordDto extends ValidateResetTokenDto {
  @Allow()
  newPassword?: unknown;
}
