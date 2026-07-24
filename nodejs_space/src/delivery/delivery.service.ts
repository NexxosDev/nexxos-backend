import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { ChatPresenceService } from '../notification/chat-presence.service';
import { AppConfigService } from '../app-config/app-config.service';
import { ConfirmDeliveryDto } from './dto/confirm-delivery.dto';

@Injectable()
export class DeliveryService {
  private readonly logger = new Logger(DeliveryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly chatPresence: ChatPresenceService,
    private readonly appConfig: AppConfigService,
  ) {}

  private haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const toRad = (d: number) => (d * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  /** Verifica acceso al chat y devuelve contexto (chat, roles, vendorRecord) */
  private async verifyAccess(chatId: string, userId: string) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        vendor: { select: { id: true, userId: true, businessName: true, latitude: true, longitude: true, fullAddress: true, freeShippingEnabled: true, freeShippingRadiusKm: true, ownDeliveryEnabled: true, ownDeliveryCost: true } },
        request: { select: { id: true, latitude: true, longitude: true } },
      },
    });
    if (!chat) throw new NotFoundException('Chat no encontrado');
    const vendorRecord = await this.prisma.vendor.findUnique({ where: { userId } });
    const isClient = chat.clientId === userId;
    const isVendor = vendorRecord?.id === chat.vendorId;
    if (!isClient && !isVendor) throw new ForbiddenException();
    return { chat, isClient, isVendor, vendorRecord };
  }

  private async pushIfAway(recipientUserId: string | null | undefined, chatId: string, title: string, body: string, data: Record<string, any>) {
    if (!recipientUserId) return;
    if (this.chatPresence.isUserInChat(recipientUserId, chatId)) {
      this.logger.debug(`Skipping push for ${recipientUserId} — viewing chat ${chatId}`);
      return;
    }
    this.notificationService
      .sendToUser(recipientUserId, title, body, data)
      .catch((err) => this.logger.error('Push error (delivery)', err));
  }

  /** Calcula opciones de envío disponibles para este chat */
  async getOptions(chatId: string, userId: string) {
    const { chat } = await this.verifyAccess(chatId, userId);
    const v = chat.vendor;
    const r = chat.request;

    let distanceKm: number | null = null;
    if (
      v?.latitude != null && v?.longitude != null &&
      r?.latitude != null && r?.longitude != null
    ) {
      distanceKm = Math.round(this.haversineKm(v.latitude, v.longitude, r.latitude, r.longitude) * 10) / 10;
    }

    const currency = await this.appConfig.get('DELIVERY_CURRENCY');
    const baseFee = parseFloat(await this.appConfig.get('DELIVERY_BASE_FEE')) || 0;
    const perKm = parseFloat(await this.appConfig.get('DELIVERY_PRICE_PER_KM')) || 0;

    const options: Array<{
      provider: string;
      label: string;
      description: string;
      cost: number;
      isFree: boolean;
    }> = [];

    // 1) Envío gratis por radio (el vendedor lo absorbe)
    if (v?.freeShippingEnabled === true) {
      const radius = v.freeShippingRadiusKm ?? null;
      const withinRadius = distanceKm != null && radius != null ? distanceKm <= radius : false;
      if (withinRadius) {
        options.push({
          provider: 'FREE_RADIUS',
          label: 'Envío gratis',
          description: radius != null ? `Dentro del radio de ${radius} km del vendedor` : 'Envío gratis del vendedor',
          cost: 0,
          isFree: true,
        });
      }
    }

    // 2) Mensajero propio del vendedor
    if (v?.ownDeliveryEnabled === true) {
      const cost = v.ownDeliveryCost ?? 0;
      options.push({
        provider: 'OWN_VENDOR',
        label: 'Mensajero del vendedor',
        description: cost > 0 ? `Envío con mensajero propio` : 'Envío con mensajero propio (sin costo)',
        cost,
        isFree: cost === 0,
      });
    }

    // 3) Estimación propia de Nexxos (base + por km)
    if (distanceKm != null) {
      const est = Math.round((baseFee + perKm * distanceKm) * 100) / 100;
      options.push({
        provider: 'ESTIMATE',
        label: 'Envío estimado',
        description: `Estimación Nexxos (${distanceKm} km)`,
        cost: est,
        isFree: false,
      });
    }

    return {
      chatId,
      distanceKm,
      currency,
      pickupAddress: v?.fullAddress ?? null,
      dropoffAddress: null,
      dropoffLat: r?.latitude ?? null,
      dropoffLng: r?.longitude ?? null,
      options,
    };
  }

  /** El vendedor ofrece envío: publica un mensaje 'delivery_offer' en el chat */
  async offer(chatId: string, userId: string) {
    const { chat, isVendor, vendorRecord } = await this.verifyAccess(chatId, userId);
    if (!isVendor) throw new ForbiddenException('Solo el vendedor puede ofrecer envío');

    const message = await this.prisma.chatMessage.create({
      data: {
        chatId,
        senderId: userId,
        messageText: '🚚 Te ofrezco envío para este pedido. Toca para ver las opciones y confirmar.',
        messageType: 'delivery_offer',
        status: 'sent',
      },
      select: {
        id: true, senderId: true, messageText: true, messageType: true, status: true, createdAt: true,
        sender: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await this.prisma.request.update({ where: { id: chat.requestId }, data: { lastMessageAt: new Date() } });

    const senderName = vendorRecord?.businessName || 'El vendedor';
    await this.pushIfAway(chat.clientId, chatId, senderName, '🚚 Te ofrece envío', { type: 'NEW_MESSAGE', chatId });

    return {
      id: message.id,
      senderId: message.senderId,
      messageText: message.messageText,
      messageType: message.messageType,
      status: message.status,
      createdAt: message.createdAt.toISOString(),
    };
  }

  /** El cliente confirma el envío: crea la orden de envío y notifica al vendedor */
  async confirm(userId: string, dto: ConfirmDeliveryDto) {
    const { chat, isClient } = await this.verifyAccess(dto.chatId, userId);
    if (!isClient) throw new ForbiddenException('Solo el cliente puede confirmar el envío');

    // Evitar duplicados: una orden activa por chat
    const existing = await this.prisma.deliveryOrder.findFirst({
      where: { chatId: dto.chatId, status: { in: ['SELECTED', 'CONFIRMED', 'IN_TRANSIT'] } },
    });
    if (existing) throw new BadRequestException('Ya existe una orden de envío activa para este chat');

    const currency = await this.appConfig.get('DELIVERY_CURRENCY');
    const now = new Date();

    let distanceKm: number | null = null;
    const v = chat.vendor;
    const r = chat.request;
    if (v?.latitude != null && v?.longitude != null && r?.latitude != null && r?.longitude != null) {
      distanceKm = Math.round(this.haversineKm(v.latitude, v.longitude, r.latitude, r.longitude) * 10) / 10;
    }

    const order = await this.prisma.deliveryOrder.create({
      data: {
        chatId: dto.chatId,
        requestId: chat.requestId,
        vendorId: chat.vendorId,
        clientId: userId,
        provider: dto.provider,
        cost: dto.isFree ? 0 : dto.cost,
        currency,
        isFree: dto.isFree,
        distanceKm,
        pickupAddress: v?.fullAddress ?? null,
        dropoffAddress: dto.dropoffAddress ?? null,
        dropoffLat: dto.dropoffLat ?? r?.latitude ?? null,
        dropoffLng: dto.dropoffLng ?? r?.longitude ?? null,
        notes: dto.notes ?? null,
        status: 'CONFIRMED',
        confirmedAt: now,
      },
    });

    const costLabel = dto.isFree ? 'Envío gratis' : `${currency} ${(dto.cost ?? 0).toFixed(2)}`;
    await this.prisma.chatMessage.create({
      data: {
        chatId: dto.chatId,
        senderId: userId,
        messageText: `✅ Envío confirmado — ${costLabel}`,
        messageType: 'delivery_update',
        status: 'sent',
      },
    });
    await this.prisma.request.update({ where: { id: chat.requestId }, data: { lastMessageAt: now } });

    await this.pushIfAway(chat.vendor?.userId, dto.chatId, 'Envío confirmado', `El cliente confirmó el envío — ${costLabel}`, { type: 'NEW_MESSAGE', chatId: dto.chatId });

    return this.formatOrder(order);
  }

  /** El vendedor avanza el estado del envío: CONFIRMED → IN_TRANSIT → DELIVERED */
  async updateStatus(orderId: string, userId: string, status: string) {
    const order = await this.prisma.deliveryOrder.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Orden de envío no encontrada');
    const { chat, isVendor } = await this.verifyAccess(order.chatId, userId);
    if (!isVendor) throw new ForbiddenException('Solo el vendedor puede actualizar el estado del envío');

    if (order.status === 'CANCELED' || order.status === 'DELIVERED') {
      throw new BadRequestException('La orden ya está finalizada');
    }

    const now = new Date();
    const data: any = { status };
    let label = '';
    if (status === 'IN_TRANSIT') {
      if (order.status !== 'CONFIRMED') throw new BadRequestException('Transición de estado inválida');
      data.inTransitAt = now;
      label = '🚚 Envío en camino';
    } else if (status === 'DELIVERED') {
      if (order.status !== 'IN_TRANSIT' && order.status !== 'CONFIRMED') throw new BadRequestException('Transición de estado inválida');
      data.deliveredAt = now;
      label = '📦 Envío entregado';
    } else {
      throw new BadRequestException('Estado inválido');
    }

    const updated = await this.prisma.deliveryOrder.update({ where: { id: orderId }, data });

    await this.prisma.chatMessage.create({
      data: { chatId: order.chatId, senderId: userId, messageText: label, messageType: 'delivery_update', status: 'sent' },
    });
    await this.prisma.request.update({ where: { id: order.requestId }, data: { lastMessageAt: now } });

    await this.pushIfAway(chat.clientId, order.chatId, 'Estado del envío', label, { type: 'NEW_MESSAGE', chatId: order.chatId });

    return this.formatOrder(updated);
  }

  /** Cancela la orden de envío (cliente o vendedor) */
  async cancel(orderId: string, userId: string) {
    const order = await this.prisma.deliveryOrder.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Orden de envío no encontrada');
    const { chat, isClient, isVendor } = await this.verifyAccess(order.chatId, userId);

    if (order.status === 'CANCELED') throw new BadRequestException('La orden ya está cancelada');
    if (order.status === 'DELIVERED') throw new BadRequestException('No se puede cancelar un envío entregado');

    const now = new Date();
    const canceledBy = isClient ? 'CLIENT' : 'VENDOR';
    const updated = await this.prisma.deliveryOrder.update({
      where: { id: orderId },
      data: { status: 'CANCELED', canceledBy, canceledAt: now },
    });

    const who = canceledBy === 'CLIENT' ? 'el cliente' : 'el vendedor';
    await this.prisma.chatMessage.create({
      data: { chatId: order.chatId, senderId: userId, messageText: `❌ Envío cancelado por ${who}`, messageType: 'delivery_update', status: 'sent' },
    });
    await this.prisma.request.update({ where: { id: order.requestId }, data: { lastMessageAt: now } });

    const recipientUserId = isClient ? chat.vendor?.userId : chat.clientId;
    await this.pushIfAway(recipientUserId, order.chatId, 'Envío cancelado', `El envío fue cancelado por ${who}`, { type: 'NEW_MESSAGE', chatId: order.chatId });

    return this.formatOrder(updated);
  }

  /** Obtiene la orden de envío activa/reciente de un chat */
  async getByChat(chatId: string, userId: string) {
    await this.verifyAccess(chatId, userId);
    const order = await this.prisma.deliveryOrder.findFirst({
      where: { chatId },
      orderBy: { createdAt: 'desc' },
    });
    return order ? this.formatOrder(order) : null;
  }

  async getById(orderId: string, userId: string) {
    const order = await this.prisma.deliveryOrder.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Orden de envío no encontrada');
    await this.verifyAccess(order.chatId, userId);
    return this.formatOrder(order);
  }

  private formatOrder(o: any) {
    return {
      id: o.id,
      chatId: o.chatId,
      requestId: o.requestId,
      vendorId: o.vendorId,
      clientId: o.clientId,
      provider: o.provider,
      cost: o.cost,
      currency: o.currency,
      isFree: o.isFree,
      distanceKm: o.distanceKm,
      pickupAddress: o.pickupAddress,
      dropoffAddress: o.dropoffAddress,
      dropoffLat: o.dropoffLat,
      dropoffLng: o.dropoffLng,
      status: o.status,
      notes: o.notes,
      canceledBy: o.canceledBy,
      confirmedAt: o.confirmedAt ? o.confirmedAt.toISOString() : null,
      inTransitAt: o.inTransitAt ? o.inTransitAt.toISOString() : null,
      deliveredAt: o.deliveredAt ? o.deliveredAt.toISOString() : null,
      canceledAt: o.canceledAt ? o.canceledAt.toISOString() : null,
      createdAt: o.createdAt ? o.createdAt.toISOString() : null,
    };
  }
}
