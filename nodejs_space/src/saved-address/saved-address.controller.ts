import { Controller, Get, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger';
import { SavedAddressService } from './saved-address.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { UpsertSavedAddressDto } from './dto/upsert-saved-address.dto';

@ApiTags('Saved Addresses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/saved-addresses')
export class SavedAddressController {
  constructor(private readonly service: SavedAddressService) {}

  @Get()
  @ApiOperation({ summary: 'Lista las direcciones guardadas del usuario (Casa/Taller/Oficina)' })
  list(@CurrentUser('id') userId: string) {
    return this.service.list(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Crea o actualiza una dirección guardada del usuario' })
  upsert(@CurrentUser('id') userId: string, @Body() dto: UpsertSavedAddressDto) {
    return this.service.upsert(userId, dto);
  }

  @Delete(':label')
  @ApiOperation({ summary: 'Elimina una dirección guardada por etiqueta' })
  @ApiParam({ name: 'label', enum: ['CASA', 'TALLER', 'OFICINA'] })
  remove(@CurrentUser('id') userId: string, @Param('label') label: string) {
    return this.service.removeByLabel(userId, label);
  }
}
