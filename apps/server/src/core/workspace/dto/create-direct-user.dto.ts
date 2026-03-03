import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsUUID,
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';
import { UserRole } from '../../../common/helpers/types/permission';

export class CreateDirectUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(60)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @IsEnum(UserRole)
  role: string;

  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  groupIds?: string[];
}
