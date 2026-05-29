import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty, IsString, IsOptional, IsArray, IsUUID, IsNumber, IsBoolean,
} from 'class-validator';

export class UpgradeToVendorDto {
  @ApiProperty() @IsNotEmpty() @IsString() businessName: string;
  @ApiProperty() @IsNotEmpty() @IsString() rif: string;
  @ApiPropertyOptional() @IsOptional() @IsString() country?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() city?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() state?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() municipality?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() parish?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() street?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() postalCode?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() latitude?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() longitude?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() referencePoint?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() fullAddress?: string;
  @ApiProperty({ type: [String] }) @IsArray() @IsUUID('4', { each: true }) vehicleModelIds: string[];
  @ApiProperty({ type: [String] }) @IsArray() @IsUUID('4', { each: true }) partSubcategoryIds: string[];
  @ApiPropertyOptional() @IsOptional() @IsString() documentImagePath?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() logoPath?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() personalDocPath?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() selfiePath?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() identityVerified?: boolean;
}
