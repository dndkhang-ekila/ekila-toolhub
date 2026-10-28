import { IsOptional, IsString } from 'class-validator';

export class GoogleAuthDto {
  @IsOptional()
  @IsString()
  credential?: string;

  @IsOptional()
  @IsString()
  code?: string;
}
