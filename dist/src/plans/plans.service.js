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
var PlansService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlansService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const notification_service_1 = require("../notification/notification.service");
const config_1 = require("@nestjs/config");
const BETA_DURATION_MONTHS = 4;
const GRACE_PERIOD_DAYS = 5;
const BETA_CUTOFF_DEFAULT = '2027-01-01';
const EARLY_REGISTRATION_REFERENCE = '2026-07-01';
let PlansService = PlansService_1 = class PlansService {
    prisma;
    notificationService;
    configService;
    logger = new common_1.Logger(PlansService_1.name);
    constructor(prisma, notificationService, configService) {
        this.prisma = prisma;
        this.notificationService = notificationService;
        this.configService = configService;
    }
    withLegacyFields(plan) {
        if (!plan)
            return plan;
        const billingCycle = (plan.precioAnual ?? 0) > 0 && (plan.precioMensual ?? 0) === 0 ? 'annual' : 'monthly';
        return {
            ...plan,
            price: plan.precioMensual ?? plan.precioAnual ?? 0,
            billingCycle,
        };
    }
    async createPlan(dto) {
        const slug = dto.slug ?? dto.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const existing = await this.prisma.plan.findUnique({ where: { slug } });
        if (existing)
            throw new common_1.BadRequestException(`Ya existe un plan con slug '${slug}'`);
        const precioMensual = dto.precioMensual ?? dto.price ?? 0;
        let prioridad = dto.prioridad;
        if (prioridad == null) {
            const maxPlan = await this.prisma.plan.findFirst({ orderBy: { prioridad: 'desc' } });
            prioridad = (maxPlan?.prioridad ?? 0) + 1;
        }
        const plan = await this.prisma.plan.create({
            data: {
                name: dto.name,
                slug,
                description: dto.description ?? '',
                solicitudesMensuales: dto.solicitudesMensuales ?? 50,
                prioridad,
                precioMensual,
                precioAnual: dto.precioAnual ?? 0,
                comisionPorcentaje: dto.comisionPorcentaje ?? 0,
                visibleEnApp: dto.visibleEnApp ?? false,
                isActive: dto.isActive ?? true,
            },
        });
        return this.withLegacyFields(plan);
    }
    async deletePlan(planId) {
        const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
        if (!plan)
            throw new common_1.NotFoundException('Plan no encontrado');
        const activeSubs = await this.prisma.vendorSubscription.count({
            where: { planId, estado: { in: ['ACTIVE', 'GRACE_PERIOD'] } },
        });
        if (activeSubs > 0) {
            throw new common_1.BadRequestException(`No se puede eliminar: ${activeSubs} vendor(es) tienen este plan activo`);
        }
        await this.prisma.plan.delete({ where: { id: planId } });
        return { deleted: true };
    }
    async listAllPlans() {
        const plans = await this.prisma.plan.findMany({ orderBy: { prioridad: 'asc' } });
        return plans.map((p) => this.withLegacyFields(p));
    }
    async listVisiblePlans() {
        return this.prisma.plan.findMany({
            where: { visibleEnApp: true, isActive: true },
            orderBy: { prioridad: 'asc' },
        });
    }
    async updatePlan(planId, dto) {
        const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
        if (!plan)
            throw new common_1.NotFoundException('Plan no encontrado');
        const data = { ...dto };
        if (data.price != null && data.precioMensual == null) {
            data.precioMensual = data.price;
        }
        delete data.price;
        delete data.billingCycle;
        const updated = await this.prisma.plan.update({ where: { id: planId }, data });
        return this.withLegacyFields(updated);
    }
    async getVendorActivePlan(vendorId) {
        const sub = await this.prisma.vendorSubscription.findFirst({
            where: { vendorId, estado: { in: ['ACTIVE', 'GRACE_PERIOD'] } },
            include: { plan: true },
            orderBy: { fechaAsignacion: 'desc' },
        });
        return sub;
    }
    async getMyPlan(userId) {
        const vendor = await this.prisma.vendor.findUnique({ where: { userId } });
        if (!vendor)
            throw new common_1.NotFoundException('Perfil de vendedor no encontrado');
        const sub = await this.getVendorActivePlan(vendor.id);
        if (!sub) {
            return { plan: null, subscription: null, monthlyRequests: { count: 0, limit: 0 } };
        }
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const monthly = await this.prisma.vendorMonthlyRequests.findUnique({
            where: { vendorId_year_month: { vendorId: vendor.id, year, month } },
        });
        const daysRemaining = sub.fechaExpiracion
            ? Math.max(0, Math.ceil((sub.fechaExpiracion.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
            : null;
        const totalDays = sub.fechaExpiracion && sub.fechaAsignacion
            ? Math.max(1, Math.ceil((sub.fechaExpiracion.getTime() - sub.fechaAsignacion.getTime()) / (1000 * 60 * 60 * 24)))
            : null;
        return {
            plan: {
                id: sub.plan.id,
                name: sub.plan.name,
                slug: sub.plan.slug,
                description: sub.plan.description,
                solicitudesMensuales: sub.plan.solicitudesMensuales,
                prioridad: sub.plan.prioridad,
                precioMensual: sub.plan.precioMensual,
                precioAnual: sub.plan.precioAnual,
                comisionPorcentaje: sub.plan.comisionPorcentaje,
            },
            subscription: {
                id: sub.id,
                estado: sub.estado,
                fechaAsignacion: sub.fechaAsignacion.toISOString(),
                fechaExpiracion: sub.fechaExpiracion?.toISOString() ?? null,
                fechaGracia: sub.fechaGracia?.toISOString() ?? null,
                daysRemaining,
                totalDays,
            },
            monthlyRequests: {
                count: monthly?.count ?? 0,
                limit: sub.plan.solicitudesMensuales,
            },
        };
    }
    async assignPlanToVendor(vendorId, planSlug, expirationMonths) {
        const plan = await this.prisma.plan.findUnique({ where: { slug: planSlug } });
        if (!plan)
            throw new common_1.NotFoundException(`Plan '${planSlug}' no encontrado`);
        await this.prisma.vendorSubscription.updateMany({
            where: { vendorId, estado: { in: ['ACTIVE', 'GRACE_PERIOD'] } },
            data: { estado: 'CANCELLED' },
        });
        const now = new Date();
        let fechaExpiracion = null;
        let fechaGracia = null;
        if (expirationMonths) {
            fechaExpiracion = new Date(now);
            fechaExpiracion.setMonth(fechaExpiracion.getMonth() + expirationMonths);
            fechaGracia = new Date(fechaExpiracion);
            fechaGracia.setDate(fechaGracia.getDate() + GRACE_PERIOD_DAYS);
        }
        return this.prisma.vendorSubscription.create({
            data: {
                vendorId,
                planId: plan.id,
                estado: 'ACTIVE',
                fechaAsignacion: now,
                fechaExpiracion,
                fechaGracia,
            },
            include: { plan: true },
        });
    }
    async assignDefaultPlan(vendorId) {
        const cutoffStr = this.configService.get('BETA_CUTOFF_DATE') || BETA_CUTOFF_DEFAULT;
        const cutoff = new Date(cutoffStr);
        const now = new Date();
        if (now < cutoff) {
            await this.assignPlanToVendor(vendorId, 'beta', BETA_DURATION_MONTHS);
            this.logger.log(`Assigned Beta plan to vendor ${vendorId} (4 months)`);
        }
        else {
            await this.assignPlanToVendor(vendorId, 'gratuito');
            this.logger.log(`Assigned Gratuito plan to vendor ${vendorId}`);
        }
    }
    async canReceiveRequests(vendorId) {
        const sub = await this.getVendorActivePlan(vendorId);
        if (!sub)
            return false;
        if (sub.plan.solicitudesMensuales === -1)
            return true;
        const now = new Date();
        const monthly = await this.prisma.vendorMonthlyRequests.findUnique({
            where: { vendorId_year_month: { vendorId, year: now.getFullYear(), month: now.getMonth() + 1 } },
        });
        return (monthly?.count ?? 0) < sub.plan.solicitudesMensuales;
    }
    async incrementMonthlyCount(vendorId) {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const record = await this.prisma.vendorMonthlyRequests.upsert({
            where: { vendorId_year_month: { vendorId, year, month } },
            update: { count: { increment: 1 } },
            create: { vendorId, year, month, count: 1 },
        });
        const sub = await this.getVendorActivePlan(vendorId);
        if (sub && sub.plan.solicitudesMensuales > 0 && record.count === sub.plan.solicitudesMensuales) {
            const vendor = await this.prisma.vendor.findUnique({ where: { id: vendorId }, select: { userId: true } });
            if (vendor) {
                this.notificationService.sendToUser(vendor.userId, '📊 Límite de solicitudes alcanzado', `Has alcanzado el límite de ${sub.plan.solicitudesMensuales} solicitudes este mes.`, { type: 'PLAN_LIMIT_REACHED' }).catch((err) => this.logger.error('Push error (plan limit)', err));
            }
        }
        return record.count;
    }
    async checkExpirations() {
        const now = new Date();
        this.logger.log('Checking plan expirations...');
        const expiredActive = await this.prisma.vendorSubscription.findMany({
            where: {
                estado: 'ACTIVE',
                fechaExpiracion: { not: null, lte: now },
            },
            include: { vendor: { select: { userId: true, businessName: true } }, plan: true },
        });
        for (const sub of expiredActive) {
            const gracaDate = new Date(now);
            gracaDate.setDate(gracaDate.getDate() + GRACE_PERIOD_DAYS);
            await this.prisma.vendorSubscription.update({
                where: { id: sub.id },
                data: { estado: 'GRACE_PERIOD', fechaGracia: gracaDate },
            });
            this.notificationService.sendToUser(sub.vendor.userId, `⚠️ Tu Plan ${sub.plan.name} ha vencido`, `Tienes ${GRACE_PERIOD_DAYS} días de beneficios extendidos.`, { type: 'PLAN_GRACE_PERIOD' }).catch((err) => this.logger.error('Push error (grace period)', err));
            this.logger.log(`Vendor ${sub.vendor.businessName} moved to GRACE_PERIOD`);
        }
        const expiredGrace = await this.prisma.vendorSubscription.findMany({
            where: {
                estado: 'GRACE_PERIOD',
                fechaGracia: { not: null, lte: now },
            },
            include: { vendor: { select: { id: true, userId: true, businessName: true } }, plan: true },
        });
        for (const sub of expiredGrace) {
            await this.prisma.vendorSubscription.update({
                where: { id: sub.id },
                data: { estado: 'EXPIRED' },
            });
            await this.assignPlanToVendor(sub.vendor.id, 'gratuito');
            this.notificationService.sendToUser(sub.vendor.userId, '📋 Tu plan ahora es Gratuito', 'Tu plan ahora es Gratuito (50 solicitudes/mes).', { type: 'PLAN_DOWNGRADED', planSlug: 'gratuito' }).catch((err) => this.logger.error('Push error (downgrade)', err));
            this.logger.log(`Vendor ${sub.vendor.businessName} downgraded to Gratuito`);
        }
        for (const daysBeforeExpiry of [15, 7, 1]) {
            const targetDate = new Date(now);
            targetDate.setDate(targetDate.getDate() + daysBeforeExpiry);
            const dayStart = new Date(targetDate);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(targetDate);
            dayEnd.setHours(23, 59, 59, 999);
            const expiringSoon = await this.prisma.vendorSubscription.findMany({
                where: {
                    estado: 'ACTIVE',
                    fechaExpiracion: { gte: dayStart, lte: dayEnd },
                },
                include: { vendor: { select: { userId: true } }, plan: true },
            });
            const emoji = daysBeforeExpiry === 1 ? '🚨' : daysBeforeExpiry === 7 ? '⚠️' : '⏳';
            const dayText = daysBeforeExpiry === 1 ? 'mañana' : `en ${daysBeforeExpiry} días`;
            for (const sub of expiringSoon) {
                this.notificationService.sendToUser(sub.vendor.userId, `${emoji} Tu Plan ${sub.plan.name} vence ${dayText}`, daysBeforeExpiry <= 7
                    ? `Tu Plan ${sub.plan.name} vence ${dayText}.`
                    : `Tu Plan ${sub.plan.name} vence ${dayText}. Pronto te informaremos sobre los planes disponibles.`, { type: 'PLAN_EXPIRING_SOON', daysRemaining: daysBeforeExpiry }).catch((err) => this.logger.error(`Push error (${daysBeforeExpiry}d warning)`, err));
            }
            if (expiringSoon.length > 0) {
                this.logger.log(`Sent ${daysBeforeExpiry}-day warning to ${expiringSoon.length} vendors`);
            }
        }
        return {
            movedToGrace: expiredActive.length,
            downgradedToGratuito: expiredGrace.length,
        };
    }
    async resetMonthlyCounts() {
        this.logger.log('Monthly counts reset check completed (counts are per year/month, no action needed)');
        return { success: true };
    }
    async adminAssignPlan(vendorId, planSlug, expirationMonths) {
        const vendor = await this.prisma.vendor.findUnique({ where: { id: vendorId } });
        if (!vendor)
            throw new common_1.NotFoundException('Vendedor no encontrado');
        const sub = await this.assignPlanToVendor(vendorId, planSlug, expirationMonths);
        this.logger.log(`Admin assigned plan '${planSlug}' to vendor ${vendorId}`);
        return sub;
    }
    async listVendorsWithPlans(limit = 50, offset = 0) {
        const [items, total] = await Promise.all([
            this.prisma.vendor.findMany({
                take: limit,
                skip: offset,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: { select: { firstName: true, lastName: true, email: true } },
                    vendorSubscriptions: {
                        where: { estado: { in: ['ACTIVE', 'GRACE_PERIOD'] } },
                        include: { plan: true },
                        take: 1,
                        orderBy: { fechaAsignacion: 'desc' },
                    },
                },
            }),
            this.prisma.vendor.count(),
        ]);
        return {
            items: items.map((v) => {
                const activeSub = v.vendorSubscriptions?.[0];
                return {
                    id: v.id,
                    businessName: v.businessName,
                    user: v.user,
                    isAvailable: v.isAvailable,
                    createdAt: v.createdAt.toISOString(),
                    currentPlan: activeSub ? {
                        name: activeSub.plan.name,
                        slug: activeSub.plan.slug,
                        estado: activeSub.estado,
                        fechaExpiracion: activeSub.fechaExpiracion?.toISOString() ?? null,
                    } : null,
                };
            }),
            total,
        };
    }
};
exports.PlansService = PlansService;
exports.PlansService = PlansService = PlansService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notification_service_1.NotificationService,
        config_1.ConfigService])
], PlansService);
//# sourceMappingURL=plans.service.js.map