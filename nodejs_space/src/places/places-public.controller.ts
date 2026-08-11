import { Controller, Post, Body, Ip } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PlacesService } from './places.service';
import { AutocompleteDto, PlaceDetailsDto } from './dto/places.dto';

// Endpoints PÚBLICOS (sin JWT) usados durante el registro de vendedor,
// donde la cuenta aún no existe y por tanto no hay token disponible.
// Se protegen con rate-limit por IP (implementado en PlacesService).
@ApiTags('Places (público)')
@Controller('api/places/public')
export class PlacesPublicController {
  constructor(private readonly service: PlacesService) {}

  @Post('autocomplete')
  @ApiOperation({ summary: 'Autocompletado de direcciones (registro, sin autenticación)' })
  autocomplete(@Ip() ip: string, @Body() dto: AutocompleteDto) {
    return this.service.autocomplete(`ip:${ip ?? 'anon'}`, dto);
  }

  @Post('details')
  @ApiOperation({ summary: 'Detalle de un lugar (registro, sin autenticación)' })
  details(@Ip() ip: string, @Body() dto: PlaceDetailsDto) {
    return this.service.details(`ip:${ip ?? 'anon'}`, dto);
  }
}
