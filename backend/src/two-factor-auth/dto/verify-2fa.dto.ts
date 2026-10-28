import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class VerifyTwoFactorDto {
  @IsNotEmpty()
  @IsString()
  userId!: string;

  @IsNotEmpty()
  @IsString()
  token!: string;

  @IsOptional()
  @IsBoolean()
  isBackupCode?: boolean;
}
