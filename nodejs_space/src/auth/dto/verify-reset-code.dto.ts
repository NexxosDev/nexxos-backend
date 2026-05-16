import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEmail } from 'class-validator';

export class VerifyResetCodeDto {
  @ApiProperty({ example: 'user@email.com' })
  @IsEmail({}, { message: 'Email inválido' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty()
  code: string;
}
