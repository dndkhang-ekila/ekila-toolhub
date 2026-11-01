import { IsIn, IsOptional } from 'class-validator';
import type { LocalePreference, ThemePreference } from '../account.types';

export class UpdatePreferencesDto {
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
