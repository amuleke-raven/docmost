import { IsNotEmpty, IsString, IsUUID, MinLength } from 'class-validator';

export class AdminResetMemberPasswordDto {
  @IsUUID()
  userId: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  newPassword: string;
}
