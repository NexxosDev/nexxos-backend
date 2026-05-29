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
import { PlansService } from '../plans/plans.service';
import { ClientPointsService } from '../client-points/client-points.service';

@Injectable()
export class RequestsService {
  private readonly logger = new Logger(RequestsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly notificationService: NotificationService,
    private readonly plansService: PlansService,
    private readonly clientPointsService: ClientPointsService,
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
    // Detect radius mode to store originalRadiusKm
    const isRadiusMode =
      typeof dto.latitude === 'number' &&
      typeof dto.longitude === 'number' &&
      typeof dto.searchRadiusKm === 'number' &&
      !dto.municipalityId &&
      !dto.stateId;

    const request = await this.prisma.request.create({
      data: {
        clientId,
        stateId: dto.stateId,
        municipalityId: dto.municipalityId,
        parishId: dto.parishId || null,
        searchRadiusKm: dto.searchRadiusKm,
        latitude: dto.latitude,
        longitude: dto.longitude,
        vehicleBrandId: dto.vehicleBrandId,
        vehicleModelId: dto.vehicleModelId,
        partCategoryId: dto.partCategoryId,
        partSubcategoryId: dto.partSubcategoryId || null,
        freeDescription: dto.freeDescription,
        lastMessageAt: now,
        originalRadiusKm: isRadiusMode ? dto.searchRadiusKm : null,
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
    // Vendor guarda state/municipality/parish como strings (nombres), no como FKs
    if (!radiusMode) {
      if (dto.parishId) {
        // Parish filter: match vendors in that specific parish (includes municipality + state)
        const parish = await this.prisma.parish.findUnique({
          where: { id: dto.parishId },
          include: { municipality: { include: { state: true } } },
        });
        if (parish) {
          matchingConditions.parish = { contains: parish.name, mode: 'insensitive' };
          matchingConditions.municipality = { contains: parish.municipality?.name, mode: 'insensitive' };
          if (parish.municipality?.state?.name) {
            matchingConditions.state = { contains: parish.municipality.state.name, mode: 'insensitive' };
          }
        }
      } else if (dto.municipalityId) {
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

    // Filter vendors by plan limits (exclude those who exceeded monthly limit)
    const eligibleVendors: { id: string }[] = [];
    for (const v of matchedVendors) {
      const canReceive = await this.plansService.canReceiveRequests(v.id);
      if (canReceive) eligibleVendors.push(v);
    }

    this.logger.log(`Matching: ${matchedVendors.length} matched, ${eligibleVendors.length} eligible (within plan limits)`);

    if (eligibleVendors.length > 0) {
      await this.prisma.requestVendorMatch.createMany({
        data: eligibleVendors.map((v: any) => ({
          requestId: request.id,
          vendorId: v.id,
        })),
      });

      // Increment metrics and monthly request counts
      await this.prisma.vendorMetrics.updateMany({
        where: { vendorId: { in: eligibleVendors.map((v: any) => v.id) } },
        data: { totalRequestsReceived: { increment: 1 } },
      });

      // Increment monthly counts for plan tracking
      for (const v of eligibleVendors) {
        this.plansService.incrementMonthlyCount(v.id).catch((err) =>
          this.logger.error(`Failed to increment monthly count for vendor ${v.id}`, err),
        );
      }
    }

    this.logger.log(`Request ${request.id} created, matched ${eligibleVendors.length} vendors`);

    // 🔔 Push: Notificar vendedores matcheados
    if (eligibleVendors.length > 0) {
      const brand = await this.prisma.vehicleBrand.findUnique({ where: { id: dto.vehicleBrandId } });
      const model = await this.prisma.vehicleModel.findUnique({ where: { id: dto.vehicleModelId } });
      const cat = await this.prisma.partCategory.findUnique({ where: { id: dto.partCategoryId } });
      const clientUser = await this.prisma.user.findUnique({ where: { id: clientId }, select: { firstName: true, lastName: true } });
      const clientName = `${clientUser?.firstName ?? ''} ${clientUser?.lastName ?? ''}`.trim() || 'Un cliente';
      const vendorRows = await this.prisma.vendor.findMany({
        where: { id: { in: eligibleVendors.map((v: any) => v.id) } },
        select: { userId: true },
      });
      const vendorUserIds = vendorRows.map((v: any) => v.userId);
      const summary = `${brand?.name ?? ''} ${model?.name ?? ''} - ${cat?.name ?? ''}`;
      this.notificationService.sendToMultiple(
        vendorUserIds,
        `📩 ${clientName} creó una solicitud`,
        summary,
        { type: 'NEW_REQUEST', requestId: request.id },
      ).catch((err) => this.logger.error('Push error (new request)', err));
    }

    // Award client points for creating a request
    this.clientPointsService.awardCreateRequest(clientId, request.id)
      .catch((err) => this.logger.error('Error awarding create request points', err));

    return {
      id: request.id,
      status: request.status,
      matchedVendorsCount: eligibleVendors.length,
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
    } else if (hasResponses === 'false') {
      where.requestResponses = { none: {} };
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
          requestRating: { select: { id: true, rating: true } },
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
        hasRating: r.status === 'CERRADA'
          ? true  // closed requests always have RequestRating → "Calificada"
          : r._count.requestResponses > 0
            ? false  // open/in-process with responses → "Sin calificar"
            : null,  // no responses → no badge
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
        parish: true,
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
      parish: request.parish ? { id: request.parish.id, name: request.parish.name } : null,
      searchRadiusKm: request.searchRadiusKm ?? null,
      originalRadiusKm: request.originalRadiusKm ?? null,
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
        let facadeImageUrl: string | null = null;
        if (r.vendor.facadeImageUrl) {
          try { facadeImageUrl = await getFileUrl(r.vendor.facadeImageUrl, true); } catch { facadeImageUrl = null; }
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

        // Get tags for this response by this client
        const tags = await this.prisma.responseTag.findMany({
          where: { responseId: r.id, userId: clientId },
          select: { tag: true },
        });

        return {
          id: r.id,
          vendor: {
            id: r.vendor.id,
            businessName: r.vendor.businessName,
            logoUrl,
            facadeImageUrl,
            avgRating: r.vendor.vendorMetrics?.avgRating ?? null,
            latitude: r.vendor.latitude ?? null,
            longitude: r.vendor.longitude ?? null,
          },
          initialMessage: r.initialMessage,
          chatId: chat?.id ?? null,
          distanceKm,
          tags: tags?.map((t: any) => t?.tag) ?? [],
          createdAt: r.createdAt.toISOString(),
        };
      }),
    );

    return { items };
  }

  // ── Helper: recalculate vendor metrics (only rating >= 1 counts) ──
  private async recalcVendorMetrics(vendorId: string) {
    const realRatings = await this.prisma.requestRating.findMany({
      where: { vendorId, rating: { gte: 1 } },
      select: { rating: true },
    });
    const avgRating = realRatings.length > 0
      ? realRatings.reduce((sum: number, r: any) => sum + r.rating, 0) / realRatings.length
      : 0;
    await this.prisma.vendorMetrics.upsert({
      where: { vendorId },
      update: { avgRating, totalRatings: realRatings.length },
      create: { vendorId, avgRating, totalRatings: realRatings.length },
    });
  }

  // ── Client: Close request ──
  async closeRequest(requestId: string, clientId: string, dto: CloseRequestDto) {
    const request = await this.prisma.request.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Solicitud no encontrada');
    if (request.clientId !== clientId) throw new ForbiddenException();
    if (request.status === 'CERRADA') throw new BadRequestException('Esta solicitud ya fue cerrada');

    // Always create a RequestRating on close:
    //   resolved + stars   → rating 1-5
    //   resolved + no stars → rating -1 (skipped)
    //   not resolved        → rating 0 ("No me ayudaron")
    const firstResponse = await this.prisma.requestResponse.findFirst({
      where: { requestId },
      select: { vendorId: true },
      orderBy: { createdAt: 'asc' },
    });

    if (dto.resolved && dto.vendorId && dto.rating) {
      // Resolved + rated with stars
      const vendor = await this.prisma.vendor.findUnique({ where: { id: dto.vendorId } });
      if (!vendor) throw new NotFoundException('Vendedor no encontrado');

      const response = await this.prisma.requestResponse.findUnique({
        where: { requestId_vendorId: { requestId, vendorId: dto.vendorId } },
      });
      if (!response) throw new BadRequestException('Este vendedor no respondió a tu solicitud');

      await this.prisma.requestRating.create({
        data: { requestId, clientId, vendorId: dto.vendorId, rating: dto.rating, comment: dto.comment || null },
      });
      await this.recalcVendorMetrics(dto.vendorId);
    } else if (dto.resolved && !dto.rating) {
      // Resolved but skipped stars → rating = -1
      const vendorId = dto.vendorId || firstResponse?.vendorId;
      if (vendorId) {
        await this.prisma.requestRating.create({
          data: { requestId, clientId, vendorId, rating: -1, comment: null },
        });
      }
    } else if (!dto.resolved) {
      // Not resolved → rating = 0
      const vendorId = firstResponse?.vendorId;
      if (vendorId) {
        await this.prisma.requestRating.create({
          data: { requestId, clientId, vendorId, rating: 0, comment: 'No resuelto' },
        });
      }
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

    // 🔔 Push: Notificar al vendedor calificado (solo si dio estrellas reales)
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

      // Award client points for rating
      const hasComment = !!(dto.comment && dto.comment.trim().length >= 20);
      this.clientPointsService.awardRating(clientId, requestId, hasComment)
        .catch((err) => this.logger.error('Error awarding rating points', err));
    }

    return {
      id: updated.id,
      status: updated.status,
      closedAt: updated.closedAt!.toISOString(),
    };
  }

  // ── Client: Rate a vendor on a closed request (separate from close) ──
  async rateVendorOnClosedRequest(requestId: string, clientId: string, vendorId: string, rating: number, comment?: string) {
    const request = await this.prisma.request.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Request not found');
    if (request.clientId !== clientId) throw new ForbiddenException();
    if (request.status !== 'CERRADA') throw new BadRequestException('La solicitud debe estar cerrada para calificar');

    // Check if already rated (allow overwriting rating<=0 i.e. -1 skipped or 0 not resolved)
    const existing = await this.prisma.requestRating.findUnique({ where: { requestId } });
    if (existing && existing.rating >= 1) {
      throw new BadRequestException('Ya calificaste a un vendedor en esta solicitud');
    }

    // Verify vendor responded to this request
    const response = await this.prisma.requestResponse.findUnique({
      where: { requestId_vendorId: { requestId, vendorId } },
    });
    if (!response) throw new BadRequestException('Este vendedor no respondió a esta solicitud');

    const vendor = await this.prisma.vendor.findUnique({ where: { id: vendorId }, select: { userId: true, businessName: true } });
    if (!vendor) throw new NotFoundException('Vendor not found');

    // Create or update rating (upsert to handle rating=0 → real rating)
    await this.prisma.requestRating.upsert({
      where: { requestId },
      update: {
        vendorId,
        rating,
        comment: comment || null,
      },
      create: {
        requestId,
        clientId,
        vendorId,
        rating,
        comment: comment || null,
      },
    });

    // Update vendor metrics (excludes rating=0 from avg)
    await this.recalcVendorMetrics(vendorId);
    // Also recalc old vendor if the rating=0 was for a different vendor
    if (existing && existing.vendorId !== vendorId) {
      await this.recalcVendorMetrics(existing.vendorId);
    }

    // Push notification to vendor
    const client = await this.prisma.user.findUnique({ where: { id: clientId }, select: { firstName: true, lastName: true } });
    const clientName = `${client?.firstName ?? ''} ${client?.lastName ?? ''}`.trim() || 'Un cliente';
    this.notificationService.sendToUser(
      vendor.userId,
      `⭐ ${clientName} te calificó`,
      `Recibiste una calificación de ${rating} estrella${rating > 1 ? 's' : ''}`,
      { type: 'RATING_RECEIVED', requestId },
    ).catch((err) => this.logger.error('Push error (rating)', err));

    // Award client points
    const hasComment = !!(comment && comment.trim().length >= 20);
    const pointsResult = await this.clientPointsService.awardRating(clientId, requestId, hasComment);

    return {
      success: true,
      pointsAwarded: pointsResult.pointsAwarded,
      bonusFirstRating: pointsResult.bonusFirstRating,
    };
  }

  // ── Client: Get requests with responses but no rating yet (open/in-process only) ──
  async getPendingRatings(clientId: string) {
    const pendingRequests = await this.prisma.request.findMany({
      where: {
        clientId,
        status: { in: ['ABIERTA', 'EN_PROCESO'] },
        requestRating: null, // no rating yet
        requestResponses: { some: {} }, // has at least one response
      },
      select: {
        id: true,
        freeDescription: true,
        createdAt: true,
        vehicleBrand: { select: { name: true } },
        vehicleModel: { select: { name: true } },
        partCategory: { select: { name: true } },
        requestResponses: {
          select: {
            vendor: {
              select: {
                id: true,
                businessName: true,
                logoUrl: true,
                vendorMetrics: { select: { avgRating: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Resolve logo URLs
    const items = await Promise.all(
      pendingRequests.map(async (r: any) => {
        const vendors = await Promise.all(
          (r.requestResponses ?? []).map(async (resp: any) => {
            let logoUrl: string | null = null;
            if (resp?.vendor?.logoUrl) {
              try { logoUrl = await getFileUrl(resp.vendor.logoUrl, true); } catch { logoUrl = null; }
            }
            return {
              id: resp?.vendor?.id,
              businessName: resp?.vendor?.businessName,
              logoUrl,
              avgRating: resp?.vendor?.vendorMetrics?.avgRating ?? null,
            };
          }),
        );
        return {
          requestId: r.id,
          description: r.freeDescription,
          createdAt: r.createdAt?.toISOString?.() ?? null,
          vehicle: `${r.vehicleBrand?.name ?? ''} ${r.vehicleModel?.name ?? ''}`.trim(),
          category: r.partCategory?.name ?? '',
          vendors,
        };
      }),
    );

    return { items, total: items.length };
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

    // Resolve client levels for all unique clients
    const clientIds = [...new Set(matches.map((m: any) => m.request?.clientId).filter(Boolean))];
    const clientLevels: Record<string, { level: string; emoji: string; label: string }> = {};
    await Promise.all(
      clientIds.map(async (cid: string) => {
        try {
          clientLevels[cid] = await this.clientPointsService.getClientLevelForUser(cid);
        } catch { clientLevels[cid] = { level: 'NUEVO', emoji: '🔵', label: 'Nuevo' }; }
      }),
    );

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
          clientLevel: clientLevels[m.request?.clientId] ?? { level: 'NUEVO', emoji: '🔵', label: 'Nuevo' },
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
            municipality: true, state: true, parish: true,
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
        parish: match.request.parish?.name ?? null,
        searchRadiusKm: match.request.searchRadiusKm ?? null,
        originalRadiusKm: match.request.originalRadiusKm ?? null,
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

  // ── Client: Update tags on a response ──
  async updateResponseTags(responseId: string, userId: string, tags: string[]) {
    const response = await this.prisma.requestResponse.findUnique({
      where: { id: responseId },
      include: { request: true },
    });
    if (!response) throw new NotFoundException('Response not found');
    if (response.request.clientId !== userId) throw new ForbiddenException();

    // Delete existing tags for this user+response, then create new ones
    await this.prisma.responseTag.deleteMany({
      where: { userId, responseId },
    });

    if (tags?.length) {
      await this.prisma.responseTag.createMany({
        data: tags.map((tag) => ({ userId, responseId, tag })),
      });
    }

    return { responseId, tags };
  }

  // ── Cron: Auto-expand search radius for GPS-based requests without responses ──
  private static readonly EXPANSION_STEP_KM = 5;
  private static readonly MAX_RADIUS_KM = 15;
  private static readonly MAX_EXPANSIONS = 2;
  private static readonly WAIT_MINUTES = 15;

  async expandSearchRadii(): Promise<{ expanded: number; maxReached: number }> {
    const cutoff = new Date(Date.now() - RequestsService.WAIT_MINUTES * 60 * 1000);

    // Find eligible requests: GPS-based, open/in-process, no responses, has room to expand
    const eligible = await this.prisma.request.findMany({
      where: {
        status: { in: ['ABIERTA', 'EN_PROCESO'] },
        originalRadiusKm: { not: null },           // GPS-based request
        latitude: { not: null },
        longitude: { not: null },
        expansionCount: { lt: RequestsService.MAX_EXPANSIONS },
        searchRadiusKm: { lt: RequestsService.MAX_RADIUS_KM },
        requestResponses: { none: {} },             // no responses yet
        // Either never expanded (check createdAt) or last expansion was > WAIT_MINUTES ago
        OR: [
          { expansionCount: 0, createdAt: { lte: cutoff } },
          { expansionCount: { gt: 0 }, lastExpansionAt: { lte: cutoff } },
        ],
      },
      include: {
        vehicleBrand: true,
        vehicleModel: true,
        partCategory: true,
        partSubcategory: true,
        requestVendorMatches: { select: { vendorId: true } },
      },
    });

    this.logger.log(`[RadiusExpansion] Found ${eligible.length} requests eligible for expansion`);

    let expanded = 0;
    let maxReached = 0;

    for (const request of eligible) {
      try {
        const currentRadius = request.searchRadiusKm ?? request.originalRadiusKm ?? 5;
        const newRadius = Math.min(currentRadius + RequestsService.EXPANSION_STEP_KM, RequestsService.MAX_RADIUS_KM);
        const newExpansionCount = request.expansionCount + 1;
        const hitMax = newRadius >= RequestsService.MAX_RADIUS_KM;

        // Find NEW vendors in expanded radius (exclude already matched)
        const alreadyMatchedIds = (request.requestVendorMatches ?? []).map((m: any) => m.vendorId);
        const matchingConditions: any = {
          isAvailable: true,
          vendorVehicleModels: { some: { vehicleModelId: request.vehicleModelId } },
          userId: { not: request.clientId },
        };
        if (alreadyMatchedIds.length > 0) {
          matchingConditions.id = { notIn: alreadyMatchedIds };
        }
        if (request.partSubcategoryId) {
          matchingConditions.vendorPartSubcategories = {
            some: { partSubcategoryId: request.partSubcategoryId },
          };
        } else {
          const subcats = await this.prisma.partSubcategory.findMany({
            where: { categoryId: request.partCategoryId },
            select: { id: true },
          });
          if (subcats.length > 0) {
            matchingConditions.vendorPartSubcategories = {
              some: { partSubcategoryId: { in: subcats.map((s: any) => s.id) } },
            };
          }
        }

        const candidates = await this.prisma.vendor.findMany({
          where: matchingConditions,
          select: { id: true, latitude: true, longitude: true, userId: true },
        });

        const clientLat = request.latitude as number;
        const clientLng = request.longitude as number;

        // Filter by new radius but exclude those within old radius (they weren't matched for a reason — plan limits etc.)
        // Actually we should include all in new radius that aren't already matched
        const newVendors = candidates.filter(
          (v: any) =>
            typeof v.latitude === 'number' &&
            typeof v.longitude === 'number' &&
            this.haversineKm(clientLat, clientLng, v.latitude, v.longitude) <= newRadius,
        );

        // Filter by plan limits
        const eligibleNew: typeof newVendors = [];
        for (const v of newVendors) {
          const canReceive = await this.plansService.canReceiveRequests(v.id);
          if (canReceive) eligibleNew.push(v);
        }

        // Update request radius
        await this.prisma.request.update({
          where: { id: request.id },
          data: {
            searchRadiusKm: newRadius,
            expansionCount: newExpansionCount,
            lastExpansionAt: new Date(),
          },
        });

        // Create matches for new vendors
        if (eligibleNew.length > 0) {
          await this.prisma.requestVendorMatch.createMany({
            data: eligibleNew.map((v: any) => ({
              requestId: request.id,
              vendorId: v.id,
            })),
            skipDuplicates: true,
          });

          // Increment metrics
          await this.prisma.vendorMetrics.updateMany({
            where: { vendorId: { in: eligibleNew.map((v: any) => v.id) } },
            data: { totalRequestsReceived: { increment: 1 } },
          });
          for (const v of eligibleNew) {
            this.plansService.incrementMonthlyCount(v.id).catch((err) =>
              this.logger.error(`Failed to increment monthly count for vendor ${v.id}`, err),
            );
          }

          // Push to new vendors
          const vendorUserIds = eligibleNew.map((v: any) => v.userId);
          const summary = `${request.vehicleBrand?.name ?? ''} ${request.vehicleModel?.name ?? ''} - ${request.partCategory?.name ?? ''}`;
          const clientUser = await this.prisma.user.findUnique({
            where: { id: request.clientId },
            select: { firstName: true, lastName: true },
          });
          const clientName = `${clientUser?.firstName ?? ''} ${clientUser?.lastName ?? ''}`.trim() || 'Un cliente';
          this.notificationService.sendToMultiple(
            vendorUserIds,
            `📩 ${clientName} creó una solicitud`,
            summary,
            { type: 'NEW_REQUEST', requestId: request.id },
          ).catch((err) => this.logger.error('Push error (expansion new vendors)', err));
        }

        // Push to client about expansion
        const originalKm = request.originalRadiusKm ?? currentRadius;
        if (!hitMax) {
          this.notificationService.sendToUser(
            request.clientId,
            '🔍 Ampliamos tu búsqueda',
            `No encontramos vendedores en ${currentRadius} km. Ampliamos la búsqueda a ${newRadius} km para ayudarte.`,
            { type: 'RADIUS_EXPANDED', requestId: request.id },
          ).catch((err) => this.logger.error('Push error (expansion client)', err));
        } else {
          this.notificationService.sendToUser(
            request.clientId,
            '🌍 Última ampliación',
            `Ahora buscamos en ${newRadius} km (máximo). Si no hay respuestas, te sugerimos crear otra solicitud.`,
            { type: 'RADIUS_MAX_REACHED', requestId: request.id },
          ).catch((err) => this.logger.error('Push error (expansion max)', err));
          maxReached++;
        }

        this.logger.log(
          `[RadiusExpansion] Request ${request.id}: ${currentRadius}km → ${newRadius}km, ${eligibleNew.length} new vendors matched`,
        );
        expanded++;
      } catch (err) {
        this.logger.error(`[RadiusExpansion] Error expanding request ${request.id}`, err);
      }
    }

    this.logger.log(`[RadiusExpansion] Done: ${expanded} expanded, ${maxReached} hit max`);
    return { expanded, maxReached };
  }
}
