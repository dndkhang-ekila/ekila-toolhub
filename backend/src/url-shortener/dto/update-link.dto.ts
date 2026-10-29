import { IsBoolean, IsOptional, IsUrl } from 'class-validator';

export class UpdateLinkDto {
  @IsOptional()
  @IsUrl({}, { message: 'Định dạng URL gốc không hợp lệ' })
  originalUrl?: string;

  @IsOptional()
  @IsBoolean({ message: 'Trạng thái hoạt động phải là boolean (true/false)' })
  isActive?: boolean;
}
