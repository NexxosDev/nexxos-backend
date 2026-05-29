import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail, IsNotEmpty, IsString, MinLength, IsOptional,
  IsIn, ValidateNested, IsArray, IsUUID, IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export class VendorSignupDto {
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
  @ApiPropertyOptional() @IsOptional() @IsString() facadeImagePath?: string;
  @ApiPropertyOptional() @IsOptional() identityVerified?: boolean;
}

export class SignupDto {
  @ApiProperty() @IsEmail() email: string;
  @ApiProperty() @IsNotEmpty() @MinLength(6) password: string;
  @ApiProperty() @IsNotEmpty() @IsString() firstName: string;
  @ApiProperty() @IsNotEmpty() @IsString() lastName: string;
  @ApiProperty() @IsNotEmpty() @IsString() phone: string;
  @ApiProperty() @IsNotEmpty() @IsString() documentId: string;
  @ApiProperty({ enum: ['CLIENTE', 'VENDEDOR'] }) @IsIn(['CLIENTE', 'VENDEDOR']) role: string;
  @ApiPropertyOptional({ type: VendorSignupDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => VendorSignupDto)
  vendor?: VendorSignupDto;
}
