import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength, IsEmail } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ example: 'user@email.com' })
  @IsEmail({}, { message: 'Email inválido' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'newPassword123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  newPassword: string;
}
