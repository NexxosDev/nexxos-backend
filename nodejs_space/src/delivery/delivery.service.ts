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

  /**
   * Calcula el costo del servicio de entrega.
   * Modo FIXED: costo único (ownDeliveryCost).
   * Modo PER_KM: costo = distancia (km) × costo por km (ownDeliveryPerKm),
   *   salvo que la distancia iguale o supere ownDeliveryFlatFromKm: en ese caso
   *   se aplica la tarifa plana especial (ownDeliveryFlatCost).
   * Devuelve { cost, approx, flatApplied } — approx=true si no hay distancia para calcular.
   */
  private computeOwnDeliveryCost(v: any, distanceKm: number | null): { cost: number; approx: boolean; flatApplied: boolean } {
    const mode = v?.ownDeliveryPricingMode ?? 'FIXED';
    if (mode !== 'PER_KM') {
      return { cost: Math.max(0, v?.ownDeliveryCost ?? 0), approx: false, flatApplied: false };
    }
    const perKm = Math.max(0, v?.ownDeliveryPerKm ?? 0);
    if (distanceKm == null) {
      // Sin distancia (faltan coordenadas): no se puede calcular todavía.
      return { cost: 0, approx: true, flatApplied: false };
    }
    // Tarifa plana especial: a partir de X km, cobrar monto fijo.
    const flatFromKm = v?.ownDeliveryFlatFromKm ?? null;
    const flatCost = v?.ownDeliveryFlatCost ?? null;
    if (flatFromKm != null && flatCost != null && flatFromKm > 0 && distanceKm >= flatFromKm) {
      return { cost: Math.max(0, Math.round(flatCost * 100) / 100), approx: false, flatApplied: true };
    }
    const cost = Math.round(distanceKm * perKm * 100) / 100;
    return { cost, approx: false, flatApplied: false };
  }

  /** Verifica acceso al chat y devuelve contexto (chat, roles, vendorRecord) */
  private async verifyAccess(chatId: string, userId: string) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        vendor: { select: { id: true, userId: true, businessName: true, latitude: true, longitude: true, fullAddress: true, deliveryEnabled: true, freeShippingEnabled: true, freeShippingRadiusKm: true, ownDeliveryEnabled: true, ownDeliveryCost: true, ownDeliveryPricingMode: true, ownDeliveryPerKm: true, ownDeliveryMaxKm: true, ownDeliveryFlatFromKm: true, ownDeliveryFlatCost: true } },
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
    const options = this.buildOptions(v, distanceKm);

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

  /** Construye la lista de opciones de envío para un vendedor y una distancia dada. */
  private buildOptions(v: any, distanceKm: number | null) {
    const options: Array<{
      provider: string;
      label: string;
      description: string;
      cost: number;
      isFree: boolean;
    }> = [];

    // Switch maestro de envíos: si el vendedor deshabilitó los envíos,
    // no se ofrece NINGUNA opción, sin importar la configuración detallada.
    if (v?.deliveryEnabled === false) {
      return options;
    }

    // 1) Envío gratis por radio (el vendedor lo absorbe)
    let freeApplied = false;
    if (v?.freeShippingEnabled === true) {
      const radius = v.freeShippingRadiusKm ?? null;
      const withinRadius = distanceKm != null && radius != null ? distanceKm <= radius : false;
      if (withinRadius) {
        freeApplied = true;
        options.push({
          provider: 'FREE_RADIUS',
          label: 'Envío gratis',
          description: radius != null ? `Dentro del radio de ${radius} km del vendedor` : 'Envío gratis del vendedor',
          cost: 0,
          isFree: true,
        });
      }
    }

    // 2) Servicio de entrega del vendedor.
    // Mutuamente excluyente con el envío gratis: si el cliente cae dentro del
    // radio de envío gratis, NO se ofrece el servicio de entrega (pago), y
    // viceversa (si no aplica gratis, solo se muestra el servicio de entrega).
    if (v?.ownDeliveryEnabled === true && !freeApplied) {
      const isPerKm = (v?.ownDeliveryPricingMode ?? 'FIXED') === 'PER_KM';
      const maxKm = v?.ownDeliveryMaxKm ?? null;
      // Filtro de distancia máxima: si supera el límite, no se ofrece el servicio.
      const beyondMax = isPerKm && maxKm != null && maxKm > 0 && distanceKm != null && distanceKm > maxKm;
      if (!beyondMax) {
        const { cost, approx, flatApplied } = this.computeOwnDeliveryCost(v, distanceKm);
        const perKm = Math.max(0, v?.ownDeliveryPerKm ?? 0);
        let description: string;
        if (isPerKm && approx) {
          description = perKm > 0
            ? `Tarifa por distancia (USD ${perKm.toFixed(2)}/km, se calcula con tu ubicación)`
            : 'Tarifa según distancia (se calcula con tu ubicación)';
        } else if (isPerKm && flatApplied) {
          description = `Tarifa plana desde ${v.ownDeliveryFlatFromKm} km (${distanceKm} km)`;
        } else if (isPerKm && distanceKm != null) {
          description = `${distanceKm} km × USD ${perKm.toFixed(2)}/km`;
        } else if (cost === 0) {
          description = 'Servicio de entrega (sin costo)';
        } else {
          description = 'Servicio de entrega del vendedor';
        }
        options.push({
          provider: 'OWN_VENDOR',
          label: 'Servicio de Entrega',
          description,
          cost,
          isFree: cost === 0,
        });
      }
    }

    return options;
  }

  /** Sigue redirecciones de enlaces cortos (goo.gl, maps.app.goo.gl) hasta obtener la URL final. */
  private async resolveShortUrl(url: string): Promise<string> {
    let current = url;
    for (let i = 0; i < 5; i++) {
      try {
        const res = await fetch(current, { method: 'GET', redirect: 'manual' as RequestRedirect });
        const status = res.status;
        if (status >= 300 && status < 400) {
          const loc = res.headers.get('location');
          if (!loc) break;
          current = loc.startsWith('http') ? loc : new URL(loc, current).toString();
          continue;
        }
        // Algunos enlaces cortos responden 200 con la URL final ya resuelta
        if ((res as any).url && (res as any).url !== current) {
          current = (res as any).url;
        }
        break;
      } catch {
        break;
      }
    }
    return current;
  }

  /**
   * Extrae coordenadas (lat, lng) de un enlace de Google Maps / WhatsApp.
   * Soporta enlaces cortos (goo.gl, maps.app.goo.gl) siguiendo redirecciones.
   */
  private async extractCoordsFromUrl(rawUrl: string): Promise<{ lat: number; lng: number } | null> {
    if (!rawUrl || typeof rawUrl !== 'string') return null;
    let url = rawUrl.trim();

    const isShort = /goo\.gl|maps\.app\.goo\.gl|g\.co/i.test(url);
    if (isShort) {
      url = await this.resolveShortUrl(url);
    }

    const tryParse = (a: string, b: string): { lat: number; lng: number } | null => {
      const lat = parseFloat(a);
      const lng = parseFloat(b);
      if (!isFinite(lat) || !isFinite(lng)) return null;
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
      return { lat, lng };
    };

    // Patrones ordenados por prioridad
    const patterns: RegExp[] = [
      /[!]3d(-?\d+\.\d+)[!]4d(-?\d+\.\d+)/, // !3dLAT!4dLNG
      /[?&](?:q|query|ll|center|destination|daddr|saddr)=(-?\d+\.\d+),\s*(-?\d+\.\d+)/i,
      /[/@](-?\d+\.\d+),\s*(-?\d+\.\d+)/, // /@LAT,LNG
      /\/(-?\d+\.\d+),\s*(-?\d+\.\d+)/, // /LAT,LNG (dir)
    ];
    for (const re of patterns) {
      const m = url.match(re);
      if (m) {
        const parsed = tryParse(m[1], m[2]);
        if (parsed) return parsed;
      }
    }

    // Último recurso: primer par "lat,lng" en cualquier parte
    const generic = url.match(/(-?\d{1,2}\.\d{3,}),\s*(-?\d{1,3}\.\d{3,})/);
    if (generic) {
      const parsed = tryParse(generic[1], generic[2]);
      if (parsed) return parsed;
    }
    return null;
  }

  /**
   * Recalcula las opciones y el costo de envío para un nuevo punto de entrega.
   * Acepta coordenadas directas (dropoffLat/dropoffLng) o un enlace de mapa (mapUrl).
   */
  async quote(chatId: string, userId: string, dto: { dropoffLat?: number; dropoffLng?: number; mapUrl?: string }) {
    const { chat } = await this.verifyAccess(chatId, userId);
    const v = chat.vendor;

    let lat = dto?.dropoffLat ?? null;
    let lng = dto?.dropoffLng ?? null;

    if ((lat == null || lng == null) && dto?.mapUrl) {
      const coords = await this.extractCoordsFromUrl(dto.mapUrl);
      if (!coords) {
        throw new BadRequestException('No pudimos extraer la ubicación del enlace. Verifica que sea un enlace válido de Google Maps.');
      }
      lat = coords.lat;
      lng = coords.lng;
    }

    if (lat == null || lng == null) {
      throw new BadRequestException('Debes indicar una ubicación de entrega (coordenadas o enlace de mapa).');
    }

    let distanceKm: number | null = null;
    if (v?.latitude != null && v?.longitude != null) {
      distanceKm = Math.round(this.haversineKm(v.latitude, v.longitude, lat, lng) * 10) / 10;
    }

    const currency = await this.appConfig.get('DELIVERY_CURRENCY');
    const options = this.buildOptions(v, distanceKm);

    return {
      chatId,
      distanceKm,
      currency,
      pickupAddress: v?.fullAddress ?? null,
      dropoffAddress: null,
      dropoffLat: lat,
      dropoffLng: lng,
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
      where: { chatId: dto.chatId, status: { in: ['SELECTED', 'CONFIRMED'] } },
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

  /** El cliente marca el envío como entregado: CONFIRMED → DELIVERED */
  async updateStatus(orderId: string, userId: string, status: string) {
    const order = await this.prisma.deliveryOrder.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Orden de envío no encontrada');
    const { chat, isClient } = await this.verifyAccess(order.chatId, userId);
    if (!isClient) throw new ForbiddenException('Solo el cliente puede marcar el envío como entregado');

    if (order.status === 'CANCELED' || order.status === 'DELIVERED') {
      throw new BadRequestException('La orden ya está finalizada');
    }

    if (status !== 'DELIVERED') throw new BadRequestException('Estado inválido');
    // Se admite CONFIRMED (o IN_TRANSIT heredado) como estado previo válido
    if (order.status !== 'CONFIRMED' && order.status !== 'IN_TRANSIT') {
      throw new BadRequestException('Transición de estado inválida');
    }

    const now = new Date();
    const label = '📦 Envío entregado';
    const updated = await this.prisma.deliveryOrder.update({
      where: { id: orderId },
      data: { status: 'DELIVERED', deliveredAt: now },
    });

    await this.prisma.chatMessage.create({
      data: { chatId: order.chatId, senderId: userId, messageText: label, messageType: 'delivery_update', status: 'sent' },
    });
    await this.prisma.request.update({ where: { id: order.requestId }, data: { lastMessageAt: now } });

    await this.pushIfAway(chat.vendor?.userId, order.chatId, 'Estado del envío', label, { type: 'NEW_MESSAGE', chatId: order.chatId });

    return this.formatOrder(updated);
  }

  /** Cancela la orden de envío (cliente o vendedor) */
  async cancel(orderId: string, userId: string) {
    const order = await this.prisma.deliveryOrder.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Orden de envío no encontrada');
    const { chat, isClient } = await this.verifyAccess(order.chatId, userId);

    if (!isClient) throw new ForbiddenException('Solo el cliente puede cancelar el envío');
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
