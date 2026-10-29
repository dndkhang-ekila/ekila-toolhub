import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Matches,
} from 'class-validator';

export class CreateLinkDto {
  @IsNotEmpty({ message: 'URL gốc không được để trống' })
  @IsUrl({}, { message: 'Định dạng URL gốc không hợp lệ' })
  originalUrl!: string;

  @IsOptional()
  @IsString()
  @Length(3, 30, { message: 'Mã rút gọn tùy chỉnh phải từ 3 đến 30 ký tự' })
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'Mã rút gọn chỉ được chứa chữ cái, số, gạch dưới và gạch ngang',
  })
  customSlug?: string;

  @IsOptional()
  @IsString()
  expiresAt?: string;
}
