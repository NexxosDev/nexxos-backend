import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsIn } from 'class-validator';

export class RegisterTokenDto {
  @ApiProperty({ description: 'Expo Push Token', example: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]' })
  @IsNotEmpty()
  @IsString()
  token: string;

  @ApiProperty({ description: 'Device platform', enum: ['android', 'ios'] })
  @IsNotEmpty()
  @IsIn(['android', 'ios'])
  platform: string;
}
