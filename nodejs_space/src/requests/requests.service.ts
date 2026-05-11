import {
  Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { CloseRequestDto } from './dto/close-request.dto';
import { RespondRequestDto } from './dto/respond-request.dto';
import { getFileUrl } from '../lib/s3';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class RequestsService {
  private readonly logger = new Logger(RequestsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly notificationService: NotificationService,
  ) {}

  // Haversine distance in kilometers
  private haversineKm(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const toRad = (d: number) => (d * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  // ── Client: Create request with auto-matching ──
  async createRequest(clientId: string, dto: CreateRequestDto) {
    const now = new Date();
    const request = await this.prisma.request.create({
      data: {
        clientId,
        stateId: dto.stateId,
        municipalityId: dto.municipalityId,
        searchRadiusKm: dto.searchRadiusKm,
        latitude: dto.latitude,
        longitude: dto.longitude,
        vehicleBrandId: dto.vehicleBrandId,
        vehicleModelId: dto.vehicleModelId,
        partCategoryId: dto.partCategoryId,
        partSubcategoryId: dto.partSubcategoryId || null,
        freeDescription: dto.freeDescription,
        lastMessageAt: now,
      },
    });

    // Matching logic
    const matchingConditions: any = {
      isAvailable: true,
      vendorVehicleModels: { some: { vehicleModelId: dto.vehicleModelId } },
    };

    // Detectar si estamos en modo "radio" (lat/lng + radiusKm, sin municipio/estado)
    const radiusMode =
      typeof dto.latitude === 'number' &&
      typeof dto.longitude === 'number' &&
      typeof dto.searchRadiusKm === 'number' &&
      !dto.municipalityId &&
      !dto.stateId;

    // Filtros geográficos (solo cuando NO estamos en modo radio)
    // Vendor guarda state/municipality como strings (nombres), no como FKs
    if (!radiusMode) {
      if (dto.municipalityId) {
        const muni = await this.prisma.municipality.findUnique({
          where: { id: dto.municipalityId },
          include: { state: true },
        });
        if (muni) {
          matchingConditions.municipality = { contains: muni.name, mode: 'insensitive' };
          if (muni.state?.name) {
            matchingConditions.state = { contains: muni.state.name, mode: 'insensitive' };
          }
        }
      } else if (dto.stateId) {
        const state = await this.prisma.state.findUnique({
          where: { id: dto.stateId },
        });
        if (state) {
          matchingConditions.state = { contains: state.name, mode: 'insensitive' };
        }
      }
    }

    if (dto.partSubcategoryId) {
      matchingConditions.vendorPartSubcategories = {
        some: { partSubcategoryId: dto.partSubcategoryId },
      };
    } else {
      // Match vendors who have any subcategory in the same category
      const subcats = await this.prisma.partSubcategory.findMany({
        where: { categoryId: dto.partCategoryId },
        select: { id: true },
      });
      if (subcats.length > 0) {
        matchingConditions.vendorPartSubcategories = {
          some: { partSubcategoryId: { in: subcats.map((s: any) => s.id) } },
        };
      }
    }

    // Exclude the client themselves from matches (if they are also a vendor)
    matchingConditions.userId = { not: clientId };

    let matchedVendors: { id: string }[];

    if (radiusMode) {
      // Filtrar por distancia Haversine en memoria
      const candidates = await this.prisma.vendor.findMany({
        where: matchingConditions,
        select: { id: true, latitude: true, longitude: true },
      });
      const clientLat = dto.latitude as number;
      const clientLng = dto.longitude as number;
      const radiusKm = dto.searchRadiusKm as number;
      matchedVendors = candidates
        .filter(
          (v: any) =>
            typeof v.latitude === 'number' &&
            typeof v.longitude === 'number' &&
            this.haversineKm(clientLat, clientLng, v.latitude, v.longitude) <= radiusKm,
        )
        .map((v: any) => ({ id: v.id }));
    } else {
      matchedVendors = await this.prisma.vendor.findMany({
        where: matchingConditions,
        select: { id: true },
      });
    }

    if (matchedVendors.length > 0) {
      await this.prisma.requestVendorMatch.createMany({
        data: matchedVendors.map((v: any) => ({
          requestId: request.id,
          vendorId: v.id,
        })),
      });

      // Increment metrics
      await this.prisma.vendorMetrics.updateMany({
        where: { vendorId: { in: matchedVendors.map((v: any) => v.id) } },
        data: { totalRequestsReceived: { increment: 1 } },
      });
    }

    this.logger.log(`Request ${request.id} created, matched ${matchedVendors.length} vendors`);

    // 🔔 Push: Notificar vendedores matcheados
    if (matchedVendors.length > 0) {
      const brand = await this.prisma.vehicleBrand.findUnique({ where: { id: dto.vehicleBrandId } });
      const model = await this.prisma.vehicleModel.findUnique({ where: { id: dto.vehicleModelId } });
      const cat = await this.prisma.partCategory.findUnique({ where: { id: dto.partCategoryId } });
      const clientUser = await this.prisma.user.findUnique({ where: { id: clientId }, select: { firstName: true, lastName: true } });
      const clientName = `${clientUser?.firstName ?? ''} ${clientUser?.lastName ?? ''}`.trim() || 'Un cliente';
      const vendorRows = await this.prisma.vendor.findMany({
        where: { id: { in: matchedVendors.map((v) => v.id) } },
        select: { userId: true },
      });
      const vendorUserIds = vendorRows.map((v) => v.userId);
      const summary = `${brand?.name ?? ''} ${model?.name ?? ''} - ${cat?.name ?? ''}`;
      this.notificationService.sendToMultiple(
        vendorUserIds,
        `📩 ${clientName} creó una solicitud`,
        summary,
        { type: 'NEW_REQUEST', requestId: request.id },
      ).catch((err) => this.logger.error('Push error (new request)', err));
    }

    return {
      id: request.id,
      status: request.status,
      matchedVendorsCount: matchedVendors.length,
      createdAt: request.createdAt.toISOString(),
    };
  }

  // ── Client: List own requests ──
  async listClientRequests(
    clientId: string,
    status?: string,
    hasResponses?: string,
    limit = 20,
    offset = 0,
  ) {
    const where: any = { clientId };
    if (status) where.status = status;
    if (hasResponses === 'true') {
      where.requestResponses = { some: {} };
    }

    const [items, total] = await Promise.all([
      this.prisma.request.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: [{ lastMessageAt: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }],
        include: {
          vehicleBrand: true,
          vehicleModel: true,
          partCategory: true,
          partSubcategory: true,
          state: true,
          municipality: true,
          _count: { select: { requestResponses: true } },
        },
      }),
      this.prisma.request.count({ where }),
    ]);

    return {
      items: items.map((r: any) => ({
        id: r.id,
        vehicleBrand: r.vehicleBrand.name,
        vehicleModel: r.vehicleModel.name,
        partCategory: r.partCategory.name,
        partSubcategory: r.partSubcategory?.name ?? null,
        status: r.status,
        responseCount: r._count.requestResponses,
        state: r.state?.name ?? null,
        municipality: r.municipality?.name ?? null,
        lastMessageAt: r.lastMessageAt?.toISOString?.() ?? null,
        createdAt: r.createdAt.toISOString(),
      })),
      total,
    };
  }

  // ── Client: Get request detail ──
  async getRequestDetail(requestId: string, userId: string) {
    const request = await this.prisma.request.findUnique({
      where: { id: requestId },
      include: {
        vehicleBrand: true,
        vehicleModel: true,
        partCategory: true,
        partSubcategory: true,
        state: true,
        municipality: true,
        _count: { select: { requestResponses: true } },
      },
    });
    if (!request) throw new NotFoundException('Request not found');
    if (request.clientId !== userId) {
      // Check if user is a vendor matched to this request
      const vendor = await this.prisma.vendor.findUnique({ where: { userId } });
      if (!vendor) throw new ForbiddenException();
      const match = await this.prisma.requestVendorMatch.findUnique({
        where: { requestId_vendorId: { requestId, vendorId: vendor.id } },
      });
      if (!match) throw new ForbiddenException();
    }

    return {
      id: request.id,
      vehicleBrand: { id: request.vehicleBrand.id, name: request.vehicleBrand.name },
      vehicleModel: { id: request.vehicleModel.id, name: request.vehicleModel.name },
      partCategory: { id: request.partCategory.id, name: request.partCategory.name },
      partSubcategory: request.partSubcategory
        ? { id: request.partSubcategory.id, name: request.partSubcategory.name }
        : null,
      state: request.state ? { id: request.state.id, name: request.state.name } : null,
      municipality: request.municipality ? { id: request.municipality.id, name: request.municipality.name } : null,
      searchRadiusKm: request.searchRadiusKm ?? null,
      freeDescription: request.freeDescription,
      status: request.status,
      responseCount: request._count.requestResponses,
      createdAt: request.createdAt.toISOString(),
      closedAt: request.closedAt?.toISOString() ?? null,
    };
  }

  // ── Client: Get responses for a request ──
  async getRequestResponses(requestId: string, clientId: string) {
    const request = await this.prisma.request.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Request not found');
    if (request.clientId !== clientId) throw new ForbiddenException();

    const responses = await this.prisma.requestResponse.findMany({
      where: { requestId },
      include: {
        vendor: {
          include: { vendorMetrics: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const clientLat = request.latitude;
    const clientLng = request.longitude;

    const items = await Promise.all(
      responses.map(async (r: any) => {
        let logoUrl: string | null = null;
        if (r.vendor.logoUrl) {
          try { logoUrl = await getFileUrl(r.vendor.logoUrl, true); } catch { logoUrl = null; }
        }
        const chat = await this.prisma.chat.findFirst({
          where: { requestId, vendorId: r.vendorId },
        });

        let distanceKm: number | null = null;
        if (
          typeof clientLat === 'number' &&
          typeof clientLng === 'number' &&
          typeof r.vendor.latitude === 'number' &&
          typeof r.vendor.longitude === 'number'
        ) {
          distanceKm = this.haversineKm(
            clientLat,
            clientLng,
            r.vendor.latitude,
            r.vendor.longitude,
          );
        }

        return {
          id: r.id,
          vendor: {
            id: r.vendor.id,
            businessName: r.vendor.businessName,
            logoUrl,
            avgRating: r.vendor.vendorMetrics?.avgRating ?? null,
            latitude: r.vendor.latitude ?? null,
            longitude: r.vendor.longitude ?? null,
          },
          initialMessage: r.initialMessage,
          chatId: chat?.id ?? null,
          distanceKm,
          createdAt: r.createdAt.toISOString(),
        };
      }),
    );

    return { items };
  }

  // ── Client: Close request ──
  async closeRequest(requestId: string, clientId: string, dto: CloseRequestDto) {
    const request = await this.prisma.request.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Request not found');
    if (request.clientId !== clientId) throw new ForbiddenException();
    if (request.status === 'CERRADA') throw new BadRequestException('Request already closed');

    if (dto.resolved) {
      if (!dto.vendorId) throw new BadRequestException('vendorId required when resolved=true');
      if (!dto.rating) throw new BadRequestException('rating required when resolved=true');

      // Verify vendor responded
      const vendor = await this.prisma.vendor.findUnique({ where: { id: dto.vendorId } });
      if (!vendor) throw new NotFoundException('Vendor not found');

      const response = await this.prisma.requestResponse.findUnique({
        where: { requestId_vendorId: { requestId, vendorId: dto.vendorId } },
      });
      if (!response) throw new BadRequestException('Vendor did not respond to this request');

      // Create rating
      await this.prisma.requestRating.create({
        data: {
          requestId,
          clientId,
          vendorId: dto.vendorId,
          rating: dto.rating,
          comment: dto.comment || null,
        },
      });

      // Update vendor metrics
      const allRatings = await this.prisma.requestRating.findMany({
        where: { vendorId: dto.vendorId },
        select: { rating: true },
      });
      const avgRating = allRatings.reduce((sum: any, r: any) => sum + r.rating, 0) / allRatings.length;
      await this.prisma.vendorMetrics.upsert({
        where: { vendorId: dto.vendorId },
        update: { avgRating, totalRatings: allRatings.length },
        create: { vendorId: dto.vendorId, avgRating, totalRatings: allRatings.length },
      });
    }

    const updated = await this.prisma.request.update({
      where: { id: requestId },
      data: { status: 'CERRADA', closedAt: new Date() },
    });

    // 🔔 Push: Notificar a vendedores que respondieron que la solicitud fue cerrada
    const closingClient = await this.prisma.user.findUnique({ where: { id: clientId }, select: { firstName: true, lastName: true } });
    const closingClientName = `${closingClient?.firstName ?? ''} ${closingClient?.lastName ?? ''}`.trim() || 'Un cliente';
    const respondedMatches = await this.prisma.requestVendorMatch.findMany({
      where: { requestId, responded: true },
      include: { vendor: { select: { userId: true, businessName: true } } },
    });
    const vendorUserIds = respondedMatches.map((m: any) => m.vendor.userId);
    if (vendorUserIds.length > 0) {
      this.notificationService.sendToMultiple(
        vendorUserIds,
        `🔒 ${closingClientName} cerró una solicitud`,
        'Una solicitud que respondiste fue cerrada',
        { type: 'REQUEST_CLOSED', requestId },
      ).catch((err) => this.logger.error('Push error (request closed)', err));
    }

    // 🔔 Push: Notificar al vendedor calificado
    if (dto.resolved && dto.vendorId && dto.rating) {
      const ratedVendor = await this.prisma.vendor.findUnique({
        where: { id: dto.vendorId },
        select: { userId: true },
      });
      if (ratedVendor) {
        this.notificationService.sendToUser(
          ratedVendor.userId,
          `⭐ ${closingClientName} te calificó`,
          `Recibiste una calificación de ${dto.rating} estrella${dto.rating > 1 ? 's' : ''}`,
          { type: 'RATING_RECEIVED', requestId },
        ).catch((err) => this.logger.error('Push error (rating)', err));
      }
    }

    return {
      id: updated.id,
      status: updated.status,
      closedAt: updated.closedAt!.toISOString(),
    };
  }

  // ── Vendor: List matched requests ──
  async listVendorRequests(
    userId: string,
    status?: string,
    limit = 20,
    offset = 0,
  ) {
    const vendor = await this.prisma.vendor.findUnique({ where: { userId } });
    if (!vendor) throw new NotFoundException('Vendor profile not found');

    const where: any = { vendorId: vendor.id };
    if (status === 'PENDING') { where.responded = false; where.declined = false; }
    else if (status === 'RESPONDED') { where.responded = true; }
    else if (status === 'DECLINED') { where.declined = true; }

    const [matches, total] = await Promise.all([
      this.prisma.requestVendorMatch.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: [{ request: { lastMessageAt: { sort: 'desc', nulls: 'last' } } }, { deliveredAt: 'desc' }],
        include: {
          request: {
            include: {
              vehicleBrand: true, vehicleModel: true,
              partCategory: true, partSubcategory: true,
              municipality: true, state: true,
              client: { select: { firstName: true, lastName: true } },
            },
          },
        },
      }),
      this.prisma.requestVendorMatch.count({ where }),
    ]);

    return {
      items: matches.map((m: any) => ({
        matchId: m.id,
        request: {
          id: m.request.id,
          vehicleBrand: m.request.vehicleBrand.name,
          vehicleModel: m.request.vehicleModel.name,
          partCategory: m.request.partCategory.name,
          partSubcategory: m.request.partSubcategory?.name ?? null,
          freeDescription: m.request.freeDescription,
          municipality: m.request.municipality?.name ?? null,
          state: m.request.state?.name ?? null,
          searchRadiusKm: m.request.searchRadiusKm,
          lastMessageAt: m.request.lastMessageAt?.toISOString?.() ?? null,
          createdAt: m.request.createdAt.toISOString(),
          clientFirstName: m.request.client.firstName,
          clientLastName: m.request.client.lastName ?? '',
        },
        status: m.request.status === 'CERRADA' ? 'CERRADA' : m.declined ? 'DECLINED' : m.responded ? 'RESPONDED' : 'PENDING',
        respondedAt: m.respondedAt?.toISOString() ?? null,
        declinedAt: m.declinedAt?.toISOString() ?? null,
      })),
      total,
    };
  }

  // ── Vendor: Get match detail ──
  async getVendorMatchDetail(userId: string, matchId: string) {
    const vendor = await this.prisma.vendor.findUnique({ where: { userId } });
    if (!vendor) throw new NotFoundException('Vendor profile not found');

    const match = await this.prisma.requestVendorMatch.findUnique({
      where: { id: matchId },
      include: {
        request: {
          include: {
            vehicleBrand: true, vehicleModel: true,
            partCategory: true, partSubcategory: true,
            municipality: true, state: true,
            client: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });
    if (!match || match.vendorId !== vendor.id) throw new NotFoundException('Match not found');

    const chat = await this.prisma.chat.findFirst({
      where: { requestId: match.requestId, vendorId: vendor.id },
    });

    return {
      matchId: match.id,
      request: {
        id: match.request.id,
        vehicleBrand: match.request.vehicleBrand.name,
        vehicleModel: match.request.vehicleModel.name,
        partCategory: match.request.partCategory.name,
        partSubcategory: match.request.partSubcategory?.name ?? null,
        freeDescription: match.request.freeDescription,
        municipality: match.request.municipality?.name ?? null,
        state: match.request.state?.name ?? null,
        searchRadiusKm: match.request.searchRadiusKm ?? null,
        createdAt: match.request.createdAt.toISOString(),
        clientFirstName: match.request.client.firstName,
        clientLastName: match.request.client.lastName ?? '',
        status: match.request.status,
      },
      status: match.request.status === 'CERRADA' ? 'CERRADA' : match.declined ? 'DECLINED' : match.responded ? 'RESPONDED' : 'PENDING',
      chatId: chat?.id ?? null,
    };
  }

  // ── Vendor: Respond to request (creates chat) ──
  async respondToRequest(userId: string, matchId: string, dto: RespondRequestDto) {
    // Modo de desarrollo: saltar validación de email si SKIP_EMAIL_VERIFICATION=true
    const skipEmailVerification = this.configService.get<string>('SKIP_EMAIL_VERIFICATION') === 'true';
    
    if (!skipEmailVerification) {
      // Verificar que el vendedor tenga su email verificado
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user?.emailVerified) {
        throw new BadRequestException('Debes verificar tu correo electrónico antes de responder a solicitudes');
      }
    } else {
      this.logger.log(`[DEV MODE] Email verification check skipped for user ${userId}`);
    }

    const vendor = await this.prisma.vendor.findUnique({ where: { userId } });
    if (!vendor) throw new NotFoundException('Vendor profile not found');

    const match = await this.prisma.requestVendorMatch.findUnique({
      where: { id: matchId },
      include: { request: true },
    });
    if (!match || match.vendorId !== vendor.id) throw new NotFoundException('Match not found');
    if (match.responded) throw new BadRequestException('Already responded');
    if (match.declined) throw new BadRequestException('Already declined');
    if (match.request.status === 'CERRADA') throw new BadRequestException('Request is closed');

    // Create response
    const response = await this.prisma.requestResponse.create({
      data: {
        requestId: match.requestId,
        vendorId: vendor.id,
        initialMessage: dto.message,
      },
    });

    // Create chat
    const chat = await this.prisma.chat.create({
      data: {
        requestId: match.requestId,
        vendorId: vendor.id,
        clientId: match.request.clientId,
      },
    });

    // Add initial message to chat
    await this.prisma.chatMessage.create({
      data: {
        chatId: chat.id,
        senderId: userId,
        messageText: dto.message,
      },
    });

    // Update match
    await this.prisma.requestVendorMatch.update({
      where: { id: matchId },
      data: { responded: true, respondedAt: new Date() },
    });

    // Update request status to EN_PROCESO if ABIERTA
    if (match.request.status === 'ABIERTA') {
      await this.prisma.request.update({
        where: { id: match.requestId },
        data: { status: 'EN_PROCESO' },
      });
    }

    // Update vendor metrics
    await this.prisma.vendorMetrics.upsert({
      where: { vendorId: vendor.id },
      update: { totalRequestsAnswered: { increment: 1 }, lastActivityAt: new Date() },
      create: { vendorId: vendor.id, totalRequestsAnswered: 1, lastActivityAt: new Date() },
    });

    this.logger.log(`Vendor ${vendor.id} responded to match ${matchId}`);

    // 🔔 Push: Notificar al cliente que un vendedor respondió
    this.notificationService.sendToUser(
      match.request.clientId,
      '💬 Nueva respuesta',
      `${vendor.businessName} respondió tu solicitud`,
      { type: 'NEW_RESPONSE', requestId: match.requestId },
    ).catch((err) => this.logger.error('Push error (vendor response)', err));

    return {
      responseId: response.id,
      chatId: chat.id,
      createdAt: response.createdAt.toISOString(),
    };
  }

  // ── Vendor: Decline request ──
  async declineRequest(userId: string, matchId: string) {
    const vendor = await this.prisma.vendor.findUnique({ where: { userId } });
    if (!vendor) throw new NotFoundException('Vendor profile not found');

    const match = await this.prisma.requestVendorMatch.findUnique({ where: { id: matchId } });
    if (!match || match.vendorId !== vendor.id) throw new NotFoundException('Match not found');
    if (match.responded) throw new BadRequestException('Already responded');
    if (match.declined) throw new BadRequestException('Already declined');

    await this.prisma.requestVendorMatch.update({
      where: { id: matchId },
      data: { declined: true, declinedAt: new Date() },
    });

    return { success: true };
  }
}
