import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { DeliveryService } from './delivery.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ConfirmDeliveryDto } from './dto/confirm-delivery.dto';
import { QuoteDeliveryDto } from './dto/quote-delivery.dto';
import { UpdateStatusDto } from './dto/update-status.dto';

@ApiTags('Delivery')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/delivery')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Get('options')
  @ApiOperation({ summary: 'Obtener opciones de envío disponibles para un chat' })
  @ApiQuery({ name: 'chatId', required: true })
  getOptions(@CurrentUser('id') userId: string, @Query('chatId') chatId: string) {
    return this.deliveryService.getOptions(chatId, userId);
  }

  @Post('offer')
  @ApiOperation({ summary: 'El vendedor ofrece envío en el chat' })
  offer(@CurrentUser('id') userId: string, @Body('chatId') chatId: string) {
    return this.deliveryService.offer(chatId, userId);
  }

  @Post('confirm')
  @ApiOperation({ summary: 'El cliente confirma el envío y crea la orden' })
  confirm(@CurrentUser('id') userId: string, @Body() dto: ConfirmDeliveryDto) {
    return this.deliveryService.confirm(userId, dto);
  }

  @Post(':chatId/quote')
  @ApiOperation({ summary: 'Recalcula el costo de envío para un nuevo punto de entrega (coordenadas o enlace de mapa)' })
  quote(@CurrentUser('id') userId: string, @Param('chatId') chatId: string, @Body() dto: QuoteDeliveryDto) {
    return this.deliveryService.quote(chatId, userId, dto);
  }

  @Get('chat/:chatId')
  @ApiOperation({ summary: 'Obtener la orden de envío más reciente de un chat' })
  getByChat(@CurrentUser('id') userId: string, @Param('chatId') chatId: string) {
    return this.deliveryService.getByChat(chatId, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una orden de envío por ID' })
  getById(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.deliveryService.getById(id, userId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'El vendedor actualiza el estado del envío' })
  updateStatus(@CurrentUser('id') userId: string, @Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.deliveryService.updateStatus(id, userId, dto.status);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancelar el envío (cliente o vendedor)' })
  cancel(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.deliveryService.cancel(id, userId);
  }
}
