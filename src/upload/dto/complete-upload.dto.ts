import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CompleteUploadDto {
  @ApiProperty() @IsString() @IsNotEmpty() cloud_storage_path: string;
  @ApiProperty() @IsString() @IsNotEmpty() fileName: string;
  @ApiProperty() @IsString() @IsNotEmpty() contentType: string;
}
