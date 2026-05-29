import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsInt, Min, Max, IsOptional, IsString } from 'class-validator';

export class RateVendorDto {
  @ApiProperty() @IsUUID() vendorId: string;
  @ApiProperty() @IsInt() @Min(1) @Max(5) rating: number;
  @ApiPropertyOptional() @IsOptional() @IsString() comment?: string;
}
