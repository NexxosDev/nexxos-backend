import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsBoolean } from 'class-validator';

export class PresignedDto {
  @ApiProperty() @IsString() @IsNotEmpty() fileName: string;
  @ApiProperty() @IsString() @IsNotEmpty() contentType: string;
  @ApiProperty() @IsBoolean() isPublic: boolean;
}
