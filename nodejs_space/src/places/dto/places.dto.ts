import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, MaxLength } from 'class-validator';

export class AutocompleteDto {
  @ApiProperty({ description: 'Texto de bsqueda que escribe el usuario' })
  @IsString()
  @MaxLength(200)
  input!: string;

  @ApiProperty({ description: 'Session token (UUIDv4) generado en el foco del input' })
  @IsString()
  @MaxLength(100)
  sessionToken!: string;

  @ApiPropertyOptional({ description: 'Latitud actual del usuario para sesgo dinmico' })
  @IsOptional()
  @IsNumber()
  lat?: number;

  @ApiPropertyOptional({ description: 'Longitud actual del usuario para sesgo dinmico' })
  @IsOptional()
  @IsNumber()
  lng?: number;
}

export class PlaceDetailsDto {
  @ApiProperty({ description: 'placeId devuelto por el autocompletado' })
  @IsString()
  @MaxLength(300)
  placeId!: string;

  @ApiProperty({ description: 'El MISMO session token usado en el autocompletado' })
  @IsString()
  @MaxLength(100)
  sessionToken!: string;
}
