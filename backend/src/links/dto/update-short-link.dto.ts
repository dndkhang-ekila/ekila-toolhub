import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateShortLinkDto {
  @IsOptional()
  @IsString({ message: 'URL gốc phải là chuỗi ký tự' })
  @MaxLength(2048, { message: 'URL không được vượt quá 2048 ký tự' })
  originalUrl?: string;

  @IsOptional()
  @IsBoolean({ message: 'isActive phải là kiểu boolean' })
  isActive?: boolean;
}
