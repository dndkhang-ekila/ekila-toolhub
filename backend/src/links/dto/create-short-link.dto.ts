import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateShortLinkDto {
  @IsNotEmpty({ message: 'URL gốc không được để trống' })
  @IsString({ message: 'URL gốc phải là chuỗi ký tự' })
  @MaxLength(2048, { message: 'URL không được vượt quá 2048 ký tự' })
  originalUrl!: string;

  @IsOptional()
  @IsString({ message: 'Slug tùy chỉnh phải là chuỗi ký tự' })
  @Length(3, 32, { message: 'Slug tùy chỉnh phải có độ dài từ 3 đến 32 ký tự' })
  @Matches(/^[a-zA-Z0-9-_]+$/, {
    message: 'Slug chỉ được chứa chữ cái, số, dấu gạch ngang và gạch dưới',
  })
  customSlug?: string;

  @IsOptional()
  @IsBoolean({ message: 'forceNew phải là giá trị boolean' })
  forceNew?: boolean;
}
