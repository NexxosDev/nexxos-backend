import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { VehiclesService } from './vehicles.service';
import { DecodeVinDto } from './dto/decode-vin.dto';

@ApiTags('Vehicles')
@Controller('api/vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post('decode-vin')
  @ApiOperation({ summary: 'Decode a VIN using NHTSA API and match to catalog brands/models' })
  decodeVin(@Body() dto: DecodeVinDto) {
    return this.vehiclesService.decodeVin(dto.vin);
  }
}
