import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CheckUrlSafetyDto {
  @IsOptional()
  @IsString({ message: 'URL phải là chuỗi ký tự' })
  @MaxLength(2048, { message: 'URL không được vượt quá 2048 ký tự' })
  url?: string;

  @IsOptional()
  @IsString({ message: 'URL phải là chuỗi ký tự' })
  @MaxLength(2048, { message: 'URL không được vượt quá 2048 ký tự' })
  originalUrl?: string;
}
