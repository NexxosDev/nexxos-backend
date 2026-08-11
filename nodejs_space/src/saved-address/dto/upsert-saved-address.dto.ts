import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsIn, IsOptional, IsNumber } from 'class-validator';

export const SAVED_ADDRESS_LABELS = ['CASA', 'TALLER', 'OFICINA'] as const;
export type SavedAddressLabel = (typeof SAVED_ADDRESS_LABELS)[number];

export class UpsertSavedAddressDto {
  @ApiProperty({ description: 'Etiqueta fija de la dirección', enum: SAVED_ADDRESS_LABELS })
  @IsString()
  @IsIn(SAVED_ADDRESS_LABELS as unknown as string[])
  label!: SavedAddressLabel;

  @ApiPropertyOptional({ description: 'Texto legible de la dirección' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'Latitud' })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitud' })
  @IsOptional()
  @IsNumber()
  longitude?: number;
}
