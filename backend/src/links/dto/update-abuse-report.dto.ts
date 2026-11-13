import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import type { AbuseReportStatus } from '../links.types';

export class UpdateAbuseReportDto {
  @IsString()
  @IsIn(['PENDING', 'RESOLVED', 'DISMISSED'])
  status: AbuseReportStatus;

  @IsString()
  @IsOptional()
  @IsIn(['DISABLE_LINK', 'DELETE_LINK', 'DISMISS', 'NONE'])
  action?: 'DISABLE_LINK' | 'DELETE_LINK' | 'DISMISS' | 'NONE';

  @IsString()
  @IsOptional()
  @MaxLength(500)
  adminNotes?: string;
}
