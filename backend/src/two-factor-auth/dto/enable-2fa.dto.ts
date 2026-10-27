import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class EnableTwoFactorDto {
  @IsNotEmpty()
  @IsString()
  userId!: string;

  @IsNotEmpty()
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/, { message: 'Token must be exactly 6 digits' })
  token!: string;
}
