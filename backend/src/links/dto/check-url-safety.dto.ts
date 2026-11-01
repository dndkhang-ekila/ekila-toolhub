import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CheckUrlSafetyDto {
  @IsNotEmpty({ message: 'URL không được để trống' })
  @IsString({ message: 'URL phải là chuỗi ký tự' })
  @MaxLength(2048, { message: 'URL không được vượt quá 2048 ký tự' })
  url!: string;
}
