import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

export class CreateBlockDto {
  @ApiProperty({ description: 'ID del usuario a bloquear' })
  @IsString()
  @IsUUID()
  blockedUserId!: string;
}
