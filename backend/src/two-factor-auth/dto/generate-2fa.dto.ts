import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GenerateTwoFactorDto {
  @IsNotEmpty()
  @IsString()
  userId!: string;

  @IsOptional()
  @IsString()
  accountName?: string;
}
