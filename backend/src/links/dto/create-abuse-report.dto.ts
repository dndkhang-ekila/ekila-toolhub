import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import type { AbuseReportReason } from '../links.types';

export class CreateAbuseReportDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  slug: string;

  @IsString()
  @IsIn(['PHISHING', 'MALWARE', 'SPAM', 'ADULT', 'COPYRIGHT', 'OTHER'])
  reason: AbuseReportReason;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  details?: string;

  @IsEmail()
  @IsOptional()
  reporterEmail?: string;
}
