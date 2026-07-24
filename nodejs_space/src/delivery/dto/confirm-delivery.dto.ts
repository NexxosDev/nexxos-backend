import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsBoolean, IsOptional, Min } from 'class-validator';

export class ConfirmDeliveryDto {
  @ApiProperty({ description: 'Chat ID donde se coordina el envío' })
  @IsString()
  chatId!: string;

  @ApiProperty({ description: 'Proveedor/tipo de envío seleccionado', example: 'OWN_VENDOR', enum: ['FREE_RADIUS', 'OWN_VENDOR'] })
  @IsString()
  provider!: string;

  @ApiProperty({ description: 'Costo del envío', example: 5.0 })
  @IsNumber()
  @Min(0)
  cost!: number;

  @ApiProperty({ description: 'Indica si el envío es gratis', example: false })
  @IsBoolean()
  isFree!: boolean;

  @ApiPropertyOptional({ description: 'Dirección de entrega' })
  @IsOptional()
  @IsString()
  dropoffAddress?: string;

  @ApiPropertyOptional({ description: 'Latitud de entrega' })
  @IsOptional()
  @IsNumber()
  dropoffLat?: number;

  @ApiPropertyOptional({ description: 'Longitud de entrega' })
  @IsOptional()
  @IsNumber()
  dropoffLng?: number;

  @ApiPropertyOptional({ description: 'Notas adicionales para el envío' })
  @IsOptional()
  @IsString()
  notes?: string;
}
