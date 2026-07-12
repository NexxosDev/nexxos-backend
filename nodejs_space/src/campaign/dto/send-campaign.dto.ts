import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsIn,
  IsOptional,
  IsArray,
  MaxLength,
} from 'class-validator';

export class SendCampaignDto {
  @ApiProperty({ example: '¡Nuevas ofertas en NEXXOS!' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title: string;

  @ApiProperty({ example: 'Descubre repuestos con descuento esta semana.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(178)
  body: string;

  @ApiPropertyOptional({
    enum: ['CLIENTE', 'VENDEDOR', 'ADMIN', 'ALL'],
    default: 'ALL',
    description: 'Segmentar por rol. ALL = todos los roles.',
  })
  @IsOptional()
  @IsIn(['CLIENTE', 'VENDEDOR', 'ADMIN', 'ALL'])
  role?: string;

  @ApiPropertyOptional({
    enum: ['ios', 'android', 'ALL'],
    default: 'ALL',
    description: 'Segmentar por plataforma del dispositivo.',
  })
  @IsOptional()
  @IsIn(['ios', 'android', 'ALL'])
  platform?: string;

  @ApiPropertyOptional({
    type: [String],
    description:
      'Lista de userIds específicos. Si se envía, ignora los filtros role/platform.',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  userIds?: string[];

  @ApiPropertyOptional({
    example: '/client/requests',
    maxLength: 500,
    description:
      'URL de destino (deep link) al tocar la notificación. Acepta rutas internas (/client/requests) o URLs externas (https://...). Viaja en data.url del push.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  actionUrl?: string;
}
