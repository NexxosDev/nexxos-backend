import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsUUID, IsInt, Min, Max, IsString } from 'class-validator';

export class CloseRequestDto {
  @ApiProperty() @IsBoolean() resolved: boolean;
  @ApiPropertyOptional() @IsOptional() @IsUUID() vendorId?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(5) rating?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() comment?: string;
}
