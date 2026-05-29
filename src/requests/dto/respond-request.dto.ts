import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class RespondRequestDto {
  @ApiProperty() @IsString() @MinLength(10) message: string;
}
