import { IsNotEmpty, IsString } from 'class-validator';

export class DisableTwoFactorDto {
  @IsNotEmpty()
  @IsString()
  userId!: string;

  @IsNotEmpty()
  @IsString()
  token!: string;
}
