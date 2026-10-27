// Mã hóa mật khẩu Sử dụng thư viện bảo mật crypto có sẵn của Node.js
// để băm mật khẩu bằng thuật toán scrypt
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsNotEmpty()
  @IsString()
  currentPassword: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  newPassword: string;
}
