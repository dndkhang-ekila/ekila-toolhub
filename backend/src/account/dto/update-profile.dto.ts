// sửa hồ sơ
import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import type { LocalePreference, ThemePreference } from '../account.types';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsIn(['light', 'dark', 'system'], {
    message: 'Theme phải là light, dark hoặc system',
  })
  theme?: ThemePreference;

  @IsOptional()
  @IsIn(['vi', 'en'], {
    message: 'Locale phải là vi hoặc en',
  })
  locale?: LocalePreference;
}
