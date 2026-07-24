import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class QuoteDeliveryDto {
  @ApiPropertyOptional({ description: 'Latitud del nuevo punto de entrega' })
  @IsOptional()
  @IsNumber()
  dropoffLat?: number;

  @ApiPropertyOptional({ description: 'Longitud del nuevo punto de entrega' })
  @IsOptional()
  @IsNumber()
  dropoffLng?: number;

  @ApiPropertyOptional({ description: 'Enlace de Google Maps / WhatsApp del cual extraer la ubicación' })
  @IsOptional()
  @IsString()
  mapUrl?: string;
}
