import { Controller, Get, Post, Param, Headers, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { PromoPopupService } from './promo-popup.service';

@ApiTags('PromoPopup')
@Controller('api/promo-popup')
export class PromoPopupController {
  constructor(private readonly service: PromoPopupService) {}

  @Get('active')
  @ApiOperation({
    summary:
      'Público: devuelve el popup promocional activo a mostrar. El capping (1/día) usa el header x-subject-id (userId si está logueado, si no deviceId).',
  })
  @ApiHeader({ name: 'x-subject-id', required: false })
  getActive(@Headers('x-subject-id') subject?: string) {
    return this.service.getActive(subject?.trim() || null);
  }

  @Post(':id/seen')
  @HttpCode(200)
  @ApiOperation({
    summary:
      'Público: marca el popup como visto hoy por el usuario/dispositivo (capping). Usa header x-subject-id.',
  })
  @ApiHeader({ name: 'x-subject-id', required: false })
  markSeen(@Param('id') id: string, @Headers('x-subject-id') subject?: string) {
    return this.service.markSeen(id, subject?.trim() || null);
  }
}
