import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PlacesService } from './places.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AutocompleteDto, PlaceDetailsDto } from './dto/places.dto';

@ApiTags('Places')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/places')
export class PlacesController {
  constructor(private readonly service: PlacesService) {}

  @Post('autocomplete')
  @ApiOperation({ summary: 'Autocompletado de direcciones (Google Places New) va proxy seguro' })
  autocomplete(@CurrentUser('id') userId: string, @Body() dto: AutocompleteDto) {
    return this.service.autocomplete(userId, dto);
  }

  @Post('details')
  @ApiOperation({ summary: 'Detalle de un lugar (coordenadas + direccin) usando el mismo session token' })
  details(@CurrentUser('id') userId: string, @Body() dto: PlaceDetailsDto) {
    return this.service.details(userId, dto);
  }
}
