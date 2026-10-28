import { IsEmail, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

export class ResendVerificationDto {
  @IsNotEmpty({ message: 'Vui lòng cung cấp địa chỉ email.' })
  @IsEmail({}, { message: 'Địa chỉ email không đúng định dạng.' })
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email: string;
}
