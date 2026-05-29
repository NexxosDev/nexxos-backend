import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class EditMessageDto {
  @ApiProperty({ description: 'New message text' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  messageText: string;
}
