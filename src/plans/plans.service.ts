import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { ConfigService } from '@nestjs/config';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { CreatePlanDto } from './dto/create-plan.dto';

const BETA_DURATION_MONTHS = 4; // for new vendors during beta period
const GRACE_PERIOD_DAYS = 5;
const BETA_CUTOFF_DEFAULT = '2027-01-01';
const EARLY_REGISTRATION_REFERENCE = '2026-07-01'; // vendors registered before this date get 4 months from this date

@Injectable()
export class PlansService {
  private readonly logger = new Logger(PlansService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly configService: ConfigService,
  ) {}

  // ── Helper: add legacy fields for admin panel v1 compatibility ──
  private withLegacyFields(plan: any) {
    if (!plan) return plan;
    const billingCycle = (plan.precioAnual ?? 0) > 0 && (plan.precioMensual ?? 0) === 0 ? 'annual' : 'monthly';
    return {
      ...plan,
      price: plan.precioMensual ?? plan.precioAnual ?? 0,
      billingCycle,
    };
  }

  // ── Create plan (admin) — accepts both new and legacy fields ──
  async createPlan(dto: CreatePlanDto) {
    // Auto-generate slug from name if not provided
    const slug = dto.slug ?? dto.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const existing = await this.prisma.plan.findUnique({ where: { slug } });
    if (existing) throw new BadRequestException(`Ya existe un plan con slug '${slug}'`);

    // Map legacy price field → precioMensual if new fields not provided
    const precioMensual = dto.precioMensual ?? dto.price ?? 0;

    // Get max prioridad if not provided
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

  // ── Delete plan (admin) ──
  async deletePlan(planId: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundException('Plan no encontrado');
    // Check if any active subscriptions use this plan
    const activeSubs = await this.prisma.vendorSubscription.count({
      where: { planId, estado: { in: ['ACTIVE', 'GRACE_PERIOD'] } },
    });
    if (activeSubs > 0) {
      throw new BadRequestException(`No se puede eliminar: ${activeSubs} vendor(es) tienen este plan activo`);
    }
    await this.prisma.plan.delete({ where: { id: planId } });
    return { deleted: true };
  }

  // ── List all plans (admin) — includes legacy fields for panel v1 ──
  async listAllPlans() {
    const plans = await this.prisma.plan.findMany({ orderBy: { prioridad: 'asc' } });
    return plans.map((p: any) => this.withLegacyFields(p));
  }

  // ── List visible plans (app) ──
  async listVisiblePlans() {
    return this.prisma.plan.findMany({
      where: { visibleEnApp: true, isActive: true },
      orderBy: { prioridad: 'asc' },
    });
  }

  // ── Update plan (admin) ──
  async updatePlan(planId: string, dto: UpdatePlanDto) {
    const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundException('Plan no encontrado');
    // Map legacy price → precioMensual
    const data: any = { ...dto };
    if (data.price != null && data.precioMensual == null) {
      data.precioMensual = data.price;
    }
    delete data.price;
    delete data.billingCycle;
    const updated = await this.prisma.plan.update({ where: { id: planId }, data });
    return this.withLegacyFields(updated);
  }

  // ── Get vendor's active plan ──
  async getVendorActivePlan(vendorId: string) {
    const sub = await this.prisma.vendorSubscription.findFirst({
      where: { vendorId, estado: { in: ['ACTIVE', 'GRACE_PERIOD'] } },
      include: { plan: true },
      orderBy: { fechaAsignacion: 'desc' },
    });
    return sub;
  }

  // ── Get my plan (for vendor user) ──
  async getMyPlan(userId: string) {
    const vendor = await this.prisma.vendor.findUnique({ where: { userId } });
    if (!vendor) throw new NotFoundException('Perfil de vendedor no encontrado');

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

  // ── Assign plan to vendor (used during registration and by admin) ──
  async assignPlanToVendor(vendorId: string, planSlug: string, expirationMonths?: number) {
    const plan = await this.prisma.plan.findUnique({ where: { slug: planSlug } });
    if (!plan) throw new NotFoundException(`Plan '${planSlug}' no encontrado`);

    // Expire current active plan
    await this.prisma.vendorSubscription.updateMany({
      where: { vendorId, estado: { in: ['ACTIVE', 'GRACE_PERIOD'] } },
      data: { estado: 'CANCELLED' },
    });

    const now = new Date();
    let fechaExpiracion: Date | null = null;
    let fechaGracia: Date | null = null;

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

  // ── Auto-assign on vendor registration ──
  async assignDefaultPlan(vendorId: string) {
    const cutoffStr = this.configService.get<string>('BETA_CUTOFF_DATE') || BETA_CUTOFF_DEFAULT;
    const cutoff = new Date(cutoffStr);
    const now = new Date();

    if (now < cutoff) {
      // Assign Beta plan with 4 months expiration
      await this.assignPlanToVendor(vendorId, 'beta', BETA_DURATION_MONTHS);
      this.logger.log(`Assigned Beta plan to vendor ${vendorId} (4 months)`);
    } else {
      // Assign Gratuito plan (no expiration)
      await this.assignPlanToVendor(vendorId, 'gratuito');
      this.logger.log(`Assigned Gratuito plan to vendor ${vendorId}`);
    }
  }

  // ── Check if vendor can receive requests (within plan limit) ──
  async canReceiveRequests(vendorId: string): Promise<boolean> {
    const sub = await this.getVendorActivePlan(vendorId);
    if (!sub) return false;

    // Unlimited
    if (sub.plan.solicitudesMensuales === -1) return true;

    const now = new Date();
    const monthly = await this.prisma.vendorMonthlyRequests.findUnique({
      where: { vendorId_year_month: { vendorId, year: now.getFullYear(), month: now.getMonth() + 1 } },
    });

    return (monthly?.count ?? 0) < sub.plan.solicitudesMensuales;
  }

  // ── Increment monthly request count ──
  async incrementMonthlyCount(vendorId: string): Promise<number> {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const record = await this.prisma.vendorMonthlyRequests.upsert({
      where: { vendorId_year_month: { vendorId, year, month } },
      update: { count: { increment: 1 } },
      create: { vendorId, year, month, count: 1 },
    });

    // Check if vendor just hit the limit
    const sub = await this.getVendorActivePlan(vendorId);
    if (sub && sub.plan.solicitudesMensuales > 0 && record.count === sub.plan.solicitudesMensuales) {
      // Send one-time notification
      const vendor = await this.prisma.vendor.findUnique({ where: { id: vendorId }, select: { userId: true } });
      if (vendor) {
        this.notificationService.sendToUser(
          vendor.userId,
          '📊 Límite de solicitudes alcanzado',
          `Has alcanzado el límite de ${sub.plan.solicitudesMensuales} solicitudes este mes.`,
          { type: 'PLAN_LIMIT_REACHED' },
        ).catch((err) => this.logger.error('Push error (plan limit)', err));
      }
    }

    return record.count;
  }

  // ── Cron: Check expirations ──
  async checkExpirations() {
    const now = new Date();
    this.logger.log('Checking plan expirations...');

    // 1. ACTIVE plans that have expired → move to GRACE_PERIOD
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

      this.notificationService.sendToUser(
        sub.vendor.userId,
        `⚠️ Tu Plan ${sub.plan.name} ha vencido`,
        `Tienes ${GRACE_PERIOD_DAYS} días de beneficios extendidos.`,
        { type: 'PLAN_GRACE_PERIOD' },
      ).catch((err) => this.logger.error('Push error (grace period)', err));

      this.logger.log(`Vendor ${sub.vendor.businessName} moved to GRACE_PERIOD`);
    }

    // 2. GRACE_PERIOD plans that have expired → move to EXPIRED and assign Gratuito
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

      // Assign Gratuito
      await this.assignPlanToVendor(sub.vendor.id, 'gratuito');

      this.notificationService.sendToUser(
        sub.vendor.userId,
        '📋 Tu plan ahora es Gratuito',
        'Tu plan ahora es Gratuito (50 solicitudes/mes).',
        { type: 'PLAN_DOWNGRADED', planSlug: 'gratuito' },
      ).catch((err) => this.logger.error('Push error (downgrade)', err));

      this.logger.log(`Vendor ${sub.vendor.businessName} downgraded to Gratuito`);
    }

    // 3. Send warning notifications (15, 7, 1 day before expiration)
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
        this.notificationService.sendToUser(
          sub.vendor.userId,
          `${emoji} Tu Plan ${sub.plan.name} vence ${dayText}`,
          daysBeforeExpiry <= 7
            ? `Tu Plan ${sub.plan.name} vence ${dayText}.`
            : `Tu Plan ${sub.plan.name} vence ${dayText}. Pronto te informaremos sobre los planes disponibles.`,
          { type: 'PLAN_EXPIRING_SOON', daysRemaining: daysBeforeExpiry },
        ).catch((err) => this.logger.error(`Push error (${daysBeforeExpiry}d warning)`, err));
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

  // ── Cron: Reset monthly counts ──
  async resetMonthlyCounts() {
    // We don't actually delete — old records are kept for history.
    // New month records are created on demand via upsert in incrementMonthlyCount.
    // This endpoint is a no-op safety check.
    this.logger.log('Monthly counts reset check completed (counts are per year/month, no action needed)');
    return { success: true };
  }

  // ── Admin: assign plan to vendor ──
  async adminAssignPlan(vendorId: string, planSlug: string, expirationMonths?: number) {
    const vendor = await this.prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) throw new NotFoundException('Vendedor no encontrado');

    const sub = await this.assignPlanToVendor(vendorId, planSlug, expirationMonths);
    this.logger.log(`Admin assigned plan '${planSlug}' to vendor ${vendorId}`);
    return sub;
  }

  // ── Admin: list vendors with plans ──
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
      items: items.map((v: any) => {
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
}
