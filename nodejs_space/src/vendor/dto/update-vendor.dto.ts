import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, IsInt, IsNumber, Min, Max, IsArray } from 'class-validator';

export class UpdateVendorDto {
  @ApiPropertyOptional() @IsOptional() @IsString() businessName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() rif?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() logoPath?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() documentImagePath?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() personalDocPath?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() selfiePath?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() facadeImagePath?: string;
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
  @ApiPropertyOptional() @IsOptional() freeShippingEnabled?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(100) freeShippingRadiusKm?: number;
  @ApiPropertyOptional() @IsOptional() ownDeliveryEnabled?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) ownDeliveryCost?: number;
  @ApiPropertyOptional({ enum: ['FIXED', 'PER_KM'] }) @IsOptional() @IsString() ownDeliveryPricingMode?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) ownDeliveryPerKm?: number;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @IsUUID('4', { each: true }) vehicleModelIds?: string[];
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @IsUUID('4', { each: true }) partSubcategoryIds?: string[];
}
