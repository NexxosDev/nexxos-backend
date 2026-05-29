"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var RequestsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
const s3_1 = require("../lib/s3");
const notification_service_1 = require("../notification/notification.service");
const plans_service_1 = require("../plans/plans.service");
const client_points_service_1 = require("../client-points/client-points.service");
let RequestsService = class RequestsService {
    static { RequestsService_1 = this; }
    prisma;
    configService;
    notificationService;
    plansService;
    clientPointsService;
    logger = new common_1.Logger(RequestsService_1.name);
    constructor(prisma, configService, notificationService, plansService, clientPointsService) {
        this.prisma = prisma;
        this.configService = configService;
        this.notificationService = notificationService;
        this.plansService = plansService;
        this.clientPointsService = clientPointsService;
    }
    haversineKm(lat1, lng1, lat2, lng2) {
        const toRad = (d) => (d * Math.PI) / 180;
        const R = 6371;
        const dLat = toRad(lat2 - lat1);
        const dLng = toRad(lng2 - lng1);
        const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
    async createRequest(clientId, dto) {
        const now = new Date();
        const isRadiusMode = typeof dto.latitude === 'number' &&
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
        const matchingConditions = {
            isAvailable: true,
            vendorVehicleModels: { some: { vehicleModelId: dto.vehicleModelId } },
        };
        const radiusMode = typeof dto.latitude === 'number' &&
            typeof dto.longitude === 'number' &&
            typeof dto.searchRadiusKm === 'number' &&
            !dto.municipalityId &&
            !dto.stateId;
        if (!radiusMode) {
            if (dto.parishId) {
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
            }
            else if (dto.municipalityId) {
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
            }
            else if (dto.stateId) {
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
        }
        else {
            const subcats = await this.prisma.partSubcategory.findMany({
                where: { categoryId: dto.partCategoryId },
                select: { id: true },
            });
            if (subcats.length > 0) {
                matchingConditions.vendorPartSubcategories = {
                    some: { partSubcategoryId: { in: subcats.map((s) => s.id) } },
                };
            }
        }
        matchingConditions.userId = { not: clientId };
        let matchedVendors;
        if (radiusMode) {
            const candidates = await this.prisma.vendor.findMany({
                where: matchingConditions,
                select: { id: true, latitude: true, longitude: true },
            });
            const clientLat = dto.latitude;
            const clientLng = dto.longitude;
            const radiusKm = dto.searchRadiusKm;
            matchedVendors = candidates
                .filter((v) => typeof v.latitude === 'number' &&
                typeof v.longitude === 'number' &&
                this.haversineKm(clientLat, clientLng, v.latitude, v.longitude) <= radiusKm)
                .map((v) => ({ id: v.id }));
        }
        else {
            matchedVendors = await this.prisma.vendor.findMany({
                where: matchingConditions,
                select: { id: true },
            });
        }
        const eligibleVendors = [];
        for (const v of matchedVendors) {
            const canReceive = await this.plansService.canReceiveRequests(v.id);
            if (canReceive)
                eligibleVendors.push(v);
        }
        this.logger.log(`Matching: ${matchedVendors.length} matched, ${eligibleVendors.length} eligible (within plan limits)`);
        if (eligibleVendors.length > 0) {
            await this.prisma.requestVendorMatch.createMany({
                data: eligibleVendors.map((v) => ({
                    requestId: request.id,
                    vendorId: v.id,
                })),
            });
            await this.prisma.vendorMetrics.updateMany({
                where: { vendorId: { in: eligibleVendors.map((v) => v.id) } },
                data: { totalRequestsReceived: { increment: 1 } },
            });
            for (const v of eligibleVendors) {
                this.plansService.incrementMonthlyCount(v.id).catch((err) => this.logger.error(`Failed to increment monthly count for vendor ${v.id}`, err));
            }
        }
        this.logger.log(`Request ${request.id} created, matched ${eligibleVendors.length} vendors`);
        if (eligibleVendors.length > 0) {
            const brand = await this.prisma.vehicleBrand.findUnique({ where: { id: dto.vehicleBrandId } });
            const model = await this.prisma.vehicleModel.findUnique({ where: { id: dto.vehicleModelId } });
            const cat = await this.prisma.partCategory.findUnique({ where: { id: dto.partCategoryId } });
            const clientUser = await this.prisma.user.findUnique({ where: { id: clientId }, select: { firstName: true, lastName: true } });
            const clientName = `${clientUser?.firstName ?? ''} ${clientUser?.lastName ?? ''}`.trim() || 'Un cliente';
            const vendorRows = await this.prisma.vendor.findMany({
                where: { id: { in: eligibleVendors.map((v) => v.id) } },
                select: { userId: true },
            });
            const vendorUserIds = vendorRows.map((v) => v.userId);
            const summary = `${brand?.name ?? ''} ${model?.name ?? ''} - ${cat?.name ?? ''}`;
            this.notificationService.sendToMultiple(vendorUserIds, `📩 ${clientName} creó una solicitud`, summary, { type: 'NEW_REQUEST', requestId: request.id }).catch((err) => this.logger.error('Push error (new request)', err));
        }
        this.clientPointsService.awardCreateRequest(clientId, request.id)
            .catch((err) => this.logger.error('Error awarding create request points', err));
        return {
            id: request.id,
            status: request.status,
            matchedVendorsCount: eligibleVendors.length,
            createdAt: request.createdAt.toISOString(),
        };
    }
    async listClientRequests(clientId, status, hasResponses, limit = 20, offset = 0) {
        const where = { clientId };
        if (status)
            where.status = status;
        if (hasResponses === 'true') {
            where.requestResponses = { some: {} };
        }
        else if (hasResponses === 'false') {
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
            items: items.map((r) => ({
                id: r.id,
                vehicleBrand: r.vehicleBrand.name,
                vehicleModel: r.vehicleModel.name,
                partCategory: r.partCategory.name,
                partSubcategory: r.partSubcategory?.name ?? null,
                status: r.status,
                responseCount: r._count.requestResponses,
                hasRating: r.status === 'CERRADA'
                    ? true
                    : r._count.requestResponses > 0
                        ? false
                        : null,
                state: r.state?.name ?? null,
                municipality: r.municipality?.name ?? null,
                lastMessageAt: r.lastMessageAt?.toISOString?.() ?? null,
                createdAt: r.createdAt.toISOString(),
            })),
            total,
        };
    }
    async getRequestDetail(requestId, userId) {
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
        if (!request)
            throw new common_1.NotFoundException('Request not found');
        if (request.clientId !== userId) {
            const vendor = await this.prisma.vendor.findUnique({ where: { userId } });
            if (!vendor)
                throw new common_1.ForbiddenException();
            const match = await this.prisma.requestVendorMatch.findUnique({
                where: { requestId_vendorId: { requestId, vendorId: vendor.id } },
            });
            if (!match)
                throw new common_1.ForbiddenException();
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
    async getRequestResponses(requestId, clientId) {
        const request = await this.prisma.request.findUnique({ where: { id: requestId } });
        if (!request)
            throw new common_1.NotFoundException('Request not found');
        if (request.clientId !== clientId)
            throw new common_1.ForbiddenException();
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
        const items = await Promise.all(responses.map(async (r) => {
            let logoUrl = null;
            if (r.vendor.logoUrl) {
                try {
                    logoUrl = await (0, s3_1.getFileUrl)(r.vendor.logoUrl, true);
                }
                catch {
                    logoUrl = null;
                }
            }
            let facadeImageUrl = null;
            if (r.vendor.facadeImageUrl) {
                try {
                    facadeImageUrl = await (0, s3_1.getFileUrl)(r.vendor.facadeImageUrl, true);
                }
                catch {
                    facadeImageUrl = null;
                }
            }
            const chat = await this.prisma.chat.findFirst({
                where: { requestId, vendorId: r.vendorId },
            });
            let distanceKm = null;
            if (typeof clientLat === 'number' &&
                typeof clientLng === 'number' &&
                typeof r.vendor.latitude === 'number' &&
                typeof r.vendor.longitude === 'number') {
                distanceKm = this.haversineKm(clientLat, clientLng, r.vendor.latitude, r.vendor.longitude);
            }
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
                tags: tags?.map((t) => t?.tag) ?? [],
                createdAt: r.createdAt.toISOString(),
            };
        }));
        return { items };
    }
    async recalcVendorMetrics(vendorId) {
        const realRatings = await this.prisma.requestRating.findMany({
            where: { vendorId, rating: { gte: 1 } },
            select: { rating: true },
        });
        const avgRating = realRatings.length > 0
            ? realRatings.reduce((sum, r) => sum + r.rating, 0) / realRatings.length
            : 0;
        await this.prisma.vendorMetrics.upsert({
            where: { vendorId },
            update: { avgRating, totalRatings: realRatings.length },
            create: { vendorId, avgRating, totalRatings: realRatings.length },
        });
    }
    async closeRequest(requestId, clientId, dto) {
        const request = await this.prisma.request.findUnique({ where: { id: requestId } });
        if (!request)
            throw new common_1.NotFoundException('Solicitud no encontrada');
        if (request.clientId !== clientId)
            throw new common_1.ForbiddenException();
        if (request.status === 'CERRADA')
            throw new common_1.BadRequestException('Esta solicitud ya fue cerrada');
        const firstResponse = await this.prisma.requestResponse.findFirst({
            where: { requestId },
            select: { vendorId: true },
            orderBy: { createdAt: 'asc' },
        });
        if (dto.resolved && dto.vendorId && dto.rating) {
            const vendor = await this.prisma.vendor.findUnique({ where: { id: dto.vendorId } });
            if (!vendor)
                throw new common_1.NotFoundException('Vendedor no encontrado');
            const response = await this.prisma.requestResponse.findUnique({
                where: { requestId_vendorId: { requestId, vendorId: dto.vendorId } },
            });
            if (!response)
                throw new common_1.BadRequestException('Este vendedor no respondió a tu solicitud');
            await this.prisma.requestRating.create({
                data: { requestId, clientId, vendorId: dto.vendorId, rating: dto.rating, comment: dto.comment || null },
            });
            await this.recalcVendorMetrics(dto.vendorId);
        }
        else if (dto.resolved && !dto.rating) {
            const vendorId = dto.vendorId || firstResponse?.vendorId;
            if (vendorId) {
                await this.prisma.requestRating.create({
                    data: { requestId, clientId, vendorId, rating: -1, comment: null },
                });
            }
        }
        else if (!dto.resolved) {
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
        const closingClient = await this.prisma.user.findUnique({ where: { id: clientId }, select: { firstName: true, lastName: true } });
        const closingClientName = `${closingClient?.firstName ?? ''} ${closingClient?.lastName ?? ''}`.trim() || 'Un cliente';
        const respondedMatches = await this.prisma.requestVendorMatch.findMany({
            where: { requestId, responded: true },
            include: { vendor: { select: { userId: true, businessName: true } } },
        });
        const vendorUserIds = respondedMatches.map((m) => m.vendor.userId);
        if (vendorUserIds.length > 0) {
            this.notificationService.sendToMultiple(vendorUserIds, `🔒 ${closingClientName} cerró una solicitud`, 'Una solicitud que respondiste fue cerrada', { type: 'REQUEST_CLOSED', requestId }).catch((err) => this.logger.error('Push error (request closed)', err));
        }
        if (dto.resolved && dto.vendorId && dto.rating) {
            const ratedVendor = await this.prisma.vendor.findUnique({
                where: { id: dto.vendorId },
                select: { userId: true },
            });
            if (ratedVendor) {
                this.notificationService.sendToUser(ratedVendor.userId, `⭐ ${closingClientName} te calificó`, `Recibiste una calificación de ${dto.rating} estrella${dto.rating > 1 ? 's' : ''}`, { type: 'RATING_RECEIVED', requestId }).catch((err) => this.logger.error('Push error (rating)', err));
            }
            const hasComment = !!(dto.comment && dto.comment.trim().length >= 20);
            this.clientPointsService.awardRating(clientId, requestId, hasComment)
                .catch((err) => this.logger.error('Error awarding rating points', err));
        }
        return {
            id: updated.id,
            status: updated.status,
            closedAt: updated.closedAt.toISOString(),
        };
    }
    async rateVendorOnClosedRequest(requestId, clientId, vendorId, rating, comment) {
        const request = await this.prisma.request.findUnique({ where: { id: requestId } });
        if (!request)
            throw new common_1.NotFoundException('Request not found');
        if (request.clientId !== clientId)
            throw new common_1.ForbiddenException();
        if (request.status !== 'CERRADA')
            throw new common_1.BadRequestException('La solicitud debe estar cerrada para calificar');
        const existing = await this.prisma.requestRating.findUnique({ where: { requestId } });
        if (existing && existing.rating >= 1) {
            throw new common_1.BadRequestException('Ya calificaste a un vendedor en esta solicitud');
        }
        const response = await this.prisma.requestResponse.findUnique({
            where: { requestId_vendorId: { requestId, vendorId } },
        });
        if (!response)
            throw new common_1.BadRequestException('Este vendedor no respondió a esta solicitud');
        const vendor = await this.prisma.vendor.findUnique({ where: { id: vendorId }, select: { userId: true, businessName: true } });
        if (!vendor)
            throw new common_1.NotFoundException('Vendor not found');
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
        await this.recalcVendorMetrics(vendorId);
        if (existing && existing.vendorId !== vendorId) {
            await this.recalcVendorMetrics(existing.vendorId);
        }
        const client = await this.prisma.user.findUnique({ where: { id: clientId }, select: { firstName: true, lastName: true } });
        const clientName = `${client?.firstName ?? ''} ${client?.lastName ?? ''}`.trim() || 'Un cliente';
        this.notificationService.sendToUser(vendor.userId, `⭐ ${clientName} te calificó`, `Recibiste una calificación de ${rating} estrella${rating > 1 ? 's' : ''}`, { type: 'RATING_RECEIVED', requestId }).catch((err) => this.logger.error('Push error (rating)', err));
        const hasComment = !!(comment && comment.trim().length >= 20);
        const pointsResult = await this.clientPointsService.awardRating(clientId, requestId, hasComment);
        return {
            success: true,
            pointsAwarded: pointsResult.pointsAwarded,
            bonusFirstRating: pointsResult.bonusFirstRating,
        };
    }
    async getPendingRatings(clientId) {
        const pendingRequests = await this.prisma.request.findMany({
            where: {
                clientId,
                status: { in: ['ABIERTA', 'EN_PROCESO'] },
                requestRating: null,
                requestResponses: { some: {} },
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
        const items = await Promise.all(pendingRequests.map(async (r) => {
            const vendors = await Promise.all((r.requestResponses ?? []).map(async (resp) => {
                let logoUrl = null;
                if (resp?.vendor?.logoUrl) {
                    try {
                        logoUrl = await (0, s3_1.getFileUrl)(resp.vendor.logoUrl, true);
                    }
                    catch {
                        logoUrl = null;
                    }
                }
                return {
                    id: resp?.vendor?.id,
                    businessName: resp?.vendor?.businessName,
                    logoUrl,
                    avgRating: resp?.vendor?.vendorMetrics?.avgRating ?? null,
                };
            }));
            return {
                requestId: r.id,
                description: r.freeDescription,
                createdAt: r.createdAt?.toISOString?.() ?? null,
                vehicle: `${r.vehicleBrand?.name ?? ''} ${r.vehicleModel?.name ?? ''}`.trim(),
                category: r.partCategory?.name ?? '',
                vendors,
            };
        }));
        return { items, total: items.length };
    }
    async listVendorRequests(userId, status, limit = 20, offset = 0) {
        const vendor = await this.prisma.vendor.findUnique({ where: { userId } });
        if (!vendor)
            throw new common_1.NotFoundException('Vendor profile not found');
        const where = { vendorId: vendor.id };
        if (status === 'PENDING') {
            where.responded = false;
            where.declined = false;
        }
        else if (status === 'RESPONDED') {
            where.responded = true;
        }
        else if (status === 'DECLINED') {
            where.declined = true;
        }
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
        const clientIds = [...new Set(matches.map((m) => m.request?.clientId).filter(Boolean))];
        const clientLevels = {};
        await Promise.all(clientIds.map(async (cid) => {
            try {
                clientLevels[cid] = await this.clientPointsService.getClientLevelForUser(cid);
            }
            catch {
                clientLevels[cid] = { level: 'NUEVO', emoji: '🔵', label: 'Nuevo' };
            }
        }));
        return {
            items: matches.map((m) => ({
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
    async getVendorMatchDetail(userId, matchId) {
        const vendor = await this.prisma.vendor.findUnique({ where: { userId } });
        if (!vendor)
            throw new common_1.NotFoundException('Vendor profile not found');
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
        if (!match || match.vendorId !== vendor.id)
            throw new common_1.NotFoundException('Match not found');
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
    async respondToRequest(userId, matchId, dto) {
        const skipEmailVerification = this.configService.get('SKIP_EMAIL_VERIFICATION') === 'true';
        if (!skipEmailVerification) {
            const user = await this.prisma.user.findUnique({ where: { id: userId } });
            if (!user?.emailVerified) {
                throw new common_1.BadRequestException('Debes verificar tu correo electrónico antes de responder a solicitudes');
            }
        }
        else {
            this.logger.log(`[DEV MODE] Email verification check skipped for user ${userId}`);
        }
        const vendor = await this.prisma.vendor.findUnique({ where: { userId } });
        if (!vendor)
            throw new common_1.NotFoundException('Vendor profile not found');
        const match = await this.prisma.requestVendorMatch.findUnique({
            where: { id: matchId },
            include: { request: true },
        });
        if (!match || match.vendorId !== vendor.id)
            throw new common_1.NotFoundException('Match not found');
        if (match.responded)
            throw new common_1.BadRequestException('Already responded');
        if (match.declined)
            throw new common_1.BadRequestException('Already declined');
        if (match.request.status === 'CERRADA')
            throw new common_1.BadRequestException('Request is closed');
        const response = await this.prisma.requestResponse.create({
            data: {
                requestId: match.requestId,
                vendorId: vendor.id,
                initialMessage: dto.message,
            },
        });
        const chat = await this.prisma.chat.create({
            data: {
                requestId: match.requestId,
                vendorId: vendor.id,
                clientId: match.request.clientId,
            },
        });
        await this.prisma.chatMessage.create({
            data: {
                chatId: chat.id,
                senderId: userId,
                messageText: dto.message,
            },
        });
        await this.prisma.requestVendorMatch.update({
            where: { id: matchId },
            data: { responded: true, respondedAt: new Date() },
        });
        if (match.request.status === 'ABIERTA') {
            await this.prisma.request.update({
                where: { id: match.requestId },
                data: { status: 'EN_PROCESO' },
            });
        }
        await this.prisma.vendorMetrics.upsert({
            where: { vendorId: vendor.id },
            update: { totalRequestsAnswered: { increment: 1 }, lastActivityAt: new Date() },
            create: { vendorId: vendor.id, totalRequestsAnswered: 1, lastActivityAt: new Date() },
        });
        this.logger.log(`Vendor ${vendor.id} responded to match ${matchId}`);
        this.notificationService.sendToUser(match.request.clientId, '💬 Nueva respuesta', `${vendor.businessName} respondió tu solicitud`, { type: 'NEW_RESPONSE', requestId: match.requestId }).catch((err) => this.logger.error('Push error (vendor response)', err));
        return {
            responseId: response.id,
            chatId: chat.id,
            createdAt: response.createdAt.toISOString(),
        };
    }
    async declineRequest(userId, matchId) {
        const vendor = await this.prisma.vendor.findUnique({ where: { userId } });
        if (!vendor)
            throw new common_1.NotFoundException('Vendor profile not found');
        const match = await this.prisma.requestVendorMatch.findUnique({ where: { id: matchId } });
        if (!match || match.vendorId !== vendor.id)
            throw new common_1.NotFoundException('Match not found');
        if (match.responded)
            throw new common_1.BadRequestException('Already responded');
        if (match.declined)
            throw new common_1.BadRequestException('Already declined');
        await this.prisma.requestVendorMatch.update({
            where: { id: matchId },
            data: { declined: true, declinedAt: new Date() },
        });
        return { success: true };
    }
    async updateResponseTags(responseId, userId, tags) {
        const response = await this.prisma.requestResponse.findUnique({
            where: { id: responseId },
            include: { request: true },
        });
        if (!response)
            throw new common_1.NotFoundException('Response not found');
        if (response.request.clientId !== userId)
            throw new common_1.ForbiddenException();
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
    static EXPANSION_STEP_KM = 5;
    static MAX_RADIUS_KM = 15;
    static MAX_EXPANSIONS = 2;
    static WAIT_MINUTES = 15;
    async expandSearchRadii() {
        const cutoff = new Date(Date.now() - RequestsService_1.WAIT_MINUTES * 60 * 1000);
        const eligible = await this.prisma.request.findMany({
            where: {
                status: { in: ['ABIERTA', 'EN_PROCESO'] },
                originalRadiusKm: { not: null },
                latitude: { not: null },
                longitude: { not: null },
                expansionCount: { lt: RequestsService_1.MAX_EXPANSIONS },
                searchRadiusKm: { lt: RequestsService_1.MAX_RADIUS_KM },
                requestResponses: { none: {} },
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
                const newRadius = Math.min(currentRadius + RequestsService_1.EXPANSION_STEP_KM, RequestsService_1.MAX_RADIUS_KM);
                const newExpansionCount = request.expansionCount + 1;
                const hitMax = newRadius >= RequestsService_1.MAX_RADIUS_KM;
                const alreadyMatchedIds = (request.requestVendorMatches ?? []).map((m) => m.vendorId);
                const matchingConditions = {
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
                }
                else {
                    const subcats = await this.prisma.partSubcategory.findMany({
                        where: { categoryId: request.partCategoryId },
                        select: { id: true },
                    });
                    if (subcats.length > 0) {
                        matchingConditions.vendorPartSubcategories = {
                            some: { partSubcategoryId: { in: subcats.map((s) => s.id) } },
                        };
                    }
                }
                const candidates = await this.prisma.vendor.findMany({
                    where: matchingConditions,
                    select: { id: true, latitude: true, longitude: true, userId: true },
                });
                const clientLat = request.latitude;
                const clientLng = request.longitude;
                const newVendors = candidates.filter((v) => typeof v.latitude === 'number' &&
                    typeof v.longitude === 'number' &&
                    this.haversineKm(clientLat, clientLng, v.latitude, v.longitude) <= newRadius);
                const eligibleNew = [];
                for (const v of newVendors) {
                    const canReceive = await this.plansService.canReceiveRequests(v.id);
                    if (canReceive)
                        eligibleNew.push(v);
                }
                await this.prisma.request.update({
                    where: { id: request.id },
                    data: {
                        searchRadiusKm: newRadius,
                        expansionCount: newExpansionCount,
                        lastExpansionAt: new Date(),
                    },
                });
                if (eligibleNew.length > 0) {
                    await this.prisma.requestVendorMatch.createMany({
                        data: eligibleNew.map((v) => ({
                            requestId: request.id,
                            vendorId: v.id,
                        })),
                        skipDuplicates: true,
                    });
                    await this.prisma.vendorMetrics.updateMany({
                        where: { vendorId: { in: eligibleNew.map((v) => v.id) } },
                        data: { totalRequestsReceived: { increment: 1 } },
                    });
                    for (const v of eligibleNew) {
                        this.plansService.incrementMonthlyCount(v.id).catch((err) => this.logger.error(`Failed to increment monthly count for vendor ${v.id}`, err));
                    }
                    const vendorUserIds = eligibleNew.map((v) => v.userId);
                    const summary = `${request.vehicleBrand?.name ?? ''} ${request.vehicleModel?.name ?? ''} - ${request.partCategory?.name ?? ''}`;
                    const clientUser = await this.prisma.user.findUnique({
                        where: { id: request.clientId },
                        select: { firstName: true, lastName: true },
                    });
                    const clientName = `${clientUser?.firstName ?? ''} ${clientUser?.lastName ?? ''}`.trim() || 'Un cliente';
                    this.notificationService.sendToMultiple(vendorUserIds, `📩 ${clientName} creó una solicitud`, summary, { type: 'NEW_REQUEST', requestId: request.id }).catch((err) => this.logger.error('Push error (expansion new vendors)', err));
                }
                const originalKm = request.originalRadiusKm ?? currentRadius;
                if (!hitMax) {
                    this.notificationService.sendToUser(request.clientId, '🔍 Ampliamos tu búsqueda', `No encontramos vendedores en ${currentRadius} km. Ampliamos la búsqueda a ${newRadius} km para ayudarte.`, { type: 'RADIUS_EXPANDED', requestId: request.id }).catch((err) => this.logger.error('Push error (expansion client)', err));
                }
                else {
                    this.notificationService.sendToUser(request.clientId, '🌍 Última ampliación', `Ahora buscamos en ${newRadius} km (máximo). Si no hay respuestas, te sugerimos crear otra solicitud.`, { type: 'RADIUS_MAX_REACHED', requestId: request.id }).catch((err) => this.logger.error('Push error (expansion max)', err));
                    maxReached++;
                }
                this.logger.log(`[RadiusExpansion] Request ${request.id}: ${currentRadius}km → ${newRadius}km, ${eligibleNew.length} new vendors matched`);
                expanded++;
            }
            catch (err) {
                this.logger.error(`[RadiusExpansion] Error expanding request ${request.id}`, err);
            }
        }
        this.logger.log(`[RadiusExpansion] Done: ${expanded} expanded, ${maxReached} hit max`);
        return { expanded, maxReached };
    }
};
exports.RequestsService = RequestsService;
exports.RequestsService = RequestsService = RequestsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        notification_service_1.NotificationService,
        plans_service_1.PlansService,
        client_points_service_1.ClientPointsService])
], RequestsService);
//# sourceMappingURL=requests.service.js.map