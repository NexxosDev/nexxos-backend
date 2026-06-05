import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { getFileUrl } from '../lib/s3';
import { ClientPointsService } from '../client-points/client-points.service';

@Injectable()
export class VendorService {
  private readonly logger = new Logger(VendorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly clientPointsService: ClientPointsService,
  ) {}

  async getVendorProfile(userId: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { userId },
      include: {
        vendorVehicleModels: { include: { vehicleModel: { include: { brand: true } } } },
        vendorPartSubcategories: { include: { partSubcategory: { include: { category: true } } } },
        vendorMetrics: true,
      },
    });
    if (!vendor) throw new NotFoundException('Vendor profile not found');

    let logoUrl: string | null = null;
    if (vendor.logoUrl) {
      try { logoUrl = await getFileUrl(vendor.logoUrl, true, this.prisma); } catch { logoUrl = null; }
    }
    let facadeImageUrl: string | null = null;
    if (vendor.facadeImageUrl) {
      try { facadeImageUrl = await getFileUrl(vendor.facadeImageUrl, true, this.prisma); } catch { facadeImageUrl = null; }
    }

    return {
      id: vendor.id,
      userId: vendor.userId,
      businessName: vendor.businessName,
      rif: vendor.rif,
      logoUrl,
      facadeImageUrl,
      country: vendor.country,
      city: vendor.city,
      state: vendor.state,
      municipality: vendor.municipality,
      parish: vendor.parish,
      street: vendor.street,
      postalCode: vendor.postalCode,
      latitude: vendor.latitude,
      longitude: vendor.longitude,
      referencePoint: vendor.referencePoint,
      fullAddress: vendor.fullAddress,
      isAvailable: vendor.isAvailable,
      vehicleModels: vendor.vendorVehicleModels.map((vvm: any) => ({
        id: vvm.vehicleModel.id,
        name: vvm.vehicleModel.name,
        brand: { id: vvm.vehicleModel.brand.id, name: vvm.vehicleModel.brand.name },
      })),
      partSubcategories: vendor.vendorPartSubcategories.map((vps: any) => ({
        id: vps.partSubcategory.id,
        name: vps.partSubcategory.name,
        category: { id: vps.partSubcategory.category.id, name: vps.partSubcategory.category.name },
      })),
      metrics: vendor.vendorMetrics
        ? {
            totalRequestsReceived: vendor.vendorMetrics.totalRequestsReceived,
            totalRequestsAnswered: vendor.vendorMetrics.totalRequestsAnswered,
            avgRating: vendor.vendorMetrics.avgRating,
            totalRatings: vendor.vendorMetrics.totalRatings,
          }
        : { totalRequestsReceived: 0, totalRequestsAnswered: 0, avgRating: null, totalRatings: 0 },
    };
  }

  async getVendorById(vendorId: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { id: vendorId },
      include: {
        vendorMetrics: true,
      },
    });
    if (!vendor) throw new NotFoundException('Vendor not found');
    let logoUrl: string | null = null;
    if (vendor.logoUrl) {
      try { logoUrl = await getFileUrl(vendor.logoUrl, true, this.prisma); } catch { logoUrl = null; }
    }
    let facadeImageUrl: string | null = null;
    if (vendor.facadeImageUrl) {
      try { facadeImageUrl = await getFileUrl(vendor.facadeImageUrl, true, this.prisma); } catch { facadeImageUrl = null; }
    }
    return {
      id: vendor.id,
      businessName: vendor.businessName,
      rif: vendor.rif,
      logoUrl,
      facadeImageUrl,
      country: vendor.country,
      city: vendor.city,
      state: vendor.state,
      municipality: vendor.municipality,
      fullAddress: vendor.fullAddress,
      isAvailable: vendor.isAvailable,
      metrics: vendor.vendorMetrics
        ? {
            totalRequestsReceived: vendor.vendorMetrics.totalRequestsReceived,
            totalRequestsAnswered: vendor.vendorMetrics.totalRequestsAnswered,
            avgRating: vendor.vendorMetrics.avgRating,
            totalRatings: vendor.vendorMetrics.totalRatings,
          }
        : null,
    };
  }

  async updateVendor(userId: string, dto: UpdateVendorDto) {
    const vendor = await this.prisma.vendor.findUnique({ where: { userId } });
    if (!vendor) throw new NotFoundException('Vendor profile not found');

    const data: Record<string, any> = {};
    if (dto.businessName !== undefined) data.businessName = dto.businessName;
    if (dto.rif !== undefined) data.rif = dto.rif;
    if (dto.logoPath !== undefined) data.logoUrl = dto.logoPath;
    if (dto.documentImagePath !== undefined) data.documentImageUrl = dto.documentImagePath;
    if (dto.personalDocPath !== undefined) data.personalDocUrl = dto.personalDocPath;
    if (dto.selfiePath !== undefined) data.selfieUrl = dto.selfiePath;
    if (dto.facadeImagePath !== undefined) data.facadeImageUrl = dto.facadeImagePath;
    if (dto.country !== undefined) data.country = dto.country;
    if (dto.city !== undefined) data.city = dto.city;
    if (dto.state !== undefined) data.state = dto.state;
    if (dto.municipality !== undefined) data.municipality = dto.municipality;
    if (dto.parish !== undefined) data.parish = dto.parish;
    if (dto.street !== undefined) data.street = dto.street;
    if (dto.postalCode !== undefined) data.postalCode = dto.postalCode;
    if (dto.latitude !== undefined) data.latitude = dto.latitude;
    if (dto.longitude !== undefined) data.longitude = dto.longitude;
    if (dto.referencePoint !== undefined) data.referencePoint = dto.referencePoint;
    if (dto.fullAddress !== undefined) data.fullAddress = dto.fullAddress;

    const updated = await this.prisma.vendor.update({ where: { id: vendor.id }, data });

    if (dto.vehicleModelIds) {
      await this.prisma.vendorVehicleModel.deleteMany({ where: { vendorId: vendor.id } });
      await this.prisma.vendorVehicleModel.createMany({
        data: dto.vehicleModelIds.map((id) => ({ vendorId: vendor.id, vehicleModelId: id })),
      });
    }
    if (dto.partSubcategoryIds) {
      await this.prisma.vendorPartSubcategory.deleteMany({ where: { vendorId: vendor.id } });
      await this.prisma.vendorPartSubcategory.createMany({
        data: dto.partSubcategoryIds.map((id) => ({ vendorId: vendor.id, partSubcategoryId: id })),
      });
    }

    let logoUrl: string | null = null;
    if (updated.logoUrl) {
      try { logoUrl = await getFileUrl(updated.logoUrl, true, this.prisma); } catch { logoUrl = null; }
    }
    let facadeImageUrl: string | null = null;
    if (updated.facadeImageUrl) {
      try { facadeImageUrl = await getFileUrl(updated.facadeImageUrl, true, this.prisma); } catch { facadeImageUrl = null; }
    }

    return {
      id: updated.id,
      businessName: updated.businessName,
      rif: updated.rif,
      logoUrl,
      facadeImageUrl,
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async toggleAvailability(userId: string, isAvailable: boolean) {
    const vendor = await this.prisma.vendor.findUnique({ where: { userId } });
    if (!vendor) throw new NotFoundException('Vendor profile not found');
    const updated = await this.prisma.vendor.update({
      where: { id: vendor.id },
      data: { isAvailable },
    });
    return { isAvailable: updated.isAvailable };
  }

  async getDashboard(userId: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { userId },
      include: {
        vendorMetrics: true,
        requestVendorMatches: {
          take: 10,
          orderBy: [{ request: { lastMessageAt: { sort: 'desc', nulls: 'last' } } }, { deliveredAt: 'desc' }],
          include: {
            request: {
              include: {
                vehicleBrand: true,
                vehicleModel: true,
                partCategory: true,
                partSubcategory: true,
                municipality: true,
                state: true,
                client: { select: { id: true, firstName: true, lastName: true } },
              },
            },
          },
        },
      },
    });
    if (!vendor) throw new NotFoundException('Vendor profile not found');

    return {
      businessName: vendor.businessName,
      isAvailable: vendor.isAvailable,
      metrics: vendor.vendorMetrics
        ? {
            totalRequestsReceived: vendor.vendorMetrics.totalRequestsReceived,
            totalRequestsAnswered: vendor.vendorMetrics.totalRequestsAnswered,
            avgRating: vendor.vendorMetrics.avgRating,
            totalRatings: vendor.vendorMetrics.totalRatings,
          }
        : { totalRequestsReceived: 0, totalRequestsAnswered: 0, avgRating: null, totalRatings: 0 },
      recentRequests: await Promise.all(vendor.requestVendorMatches.map(async (m: any) => {
        const deliveredAt = m.deliveredAt ? m.deliveredAt.toISOString() : null;
        const respondedAt = m.respondedAt ? m.respondedAt.toISOString() : null;
        const declinedAt = m.declinedAt ? m.declinedAt.toISOString() : null;

        let status = 'PENDING';
        if (m.request.status === 'CERRADA') status = 'CERRADA';
        else if (m.declined) status = 'DECLINED';
        else if (m.responded) status = 'RESPONDED';

        let clientLevel = { level: 'NUEVO', emoji: '🔵', label: 'Nuevo' };
        try {
          if (m.request.client?.id) {
            clientLevel = await this.clientPointsService.getClientLevelForUser(m.request.client.id);
          }
        } catch { /* fallback to default */ }

        return {
          matchId: m.id,
          request: {
            id: m.request.id,
            vehicleBrand: m.request.vehicleBrand.name,
            vehicleModel: m.request.vehicleModel.name,
            vehicleYear: m.request.vehicleYear ?? null,
            partCategory: m.request.partCategory.name,
            partSubcategory: m.request.partSubcategory?.name ?? null,
            municipality: m.request.municipality?.name ?? null,
            state: m.request.state?.name ?? null,
            createdAt: m.request.createdAt.toISOString(),
            clientFirstName: m.request.client?.firstName ?? '',
            clientLastName: m.request.client?.lastName ?? '',
            clientLevel,
          },
          status,
          deliveredAt,
          respondedAt,
          declinedAt,
          responded: !!m.responded,
          declined: !!m.declined,
        };
      })),
    };
  }

  async getResponseTimeMetrics(userId: string) {
    const vendor = await this.prisma.vendor.findUnique({ where: { userId } });
    if (!vendor) throw new NotFoundException('Vendor profile not found');

    // Count responded OR declined as "actioned" (vendor gave a response, even if negative)
    const matches = await this.prisma.requestVendorMatch.findMany({
      where: {
        vendorId: vendor.id,
        OR: [
          { responded: true, respondedAt: { not: null } },
          { declined: true, declinedAt: { not: null } },
        ],
      },
      select: { deliveredAt: true, respondedAt: true, declinedAt: true, responded: true, declined: true },
    });

    if (matches.length === 0) {
      const totalReceived = await this.prisma.requestVendorMatch.count({
        where: { vendorId: vendor.id },
      });
      return {
        totalResponded: 0,
        totalReceived,
        responseRate: 0,
        avgResponseTimeMs: null,
        medianResponseTimeMs: null,
        fastestResponseTimeMs: null,
        slowestResponseTimeMs: null,
      };
    }

    const totalReceived = await this.prisma.requestVendorMatch.count({
      where: { vendorId: vendor.id },
    });

    // Use respondedAt for responses, declinedAt for declines — whichever is available
    const deltas = matches
      .map((m: any) => {
        const actionTime = m.respondedAt ?? m.declinedAt;
        if (!actionTime || !m.deliveredAt) return null;
        return new Date(actionTime).getTime() - new Date(m.deliveredAt).getTime();
      })
      .filter((d: number | null): d is number => d !== null && d >= 0)
      .sort((a: number, b: number) => a - b);

    const sum = deltas.reduce((a: number, b: number) => a + b, 0);
    const avg = deltas.length > 0 ? Math.round(sum / deltas.length) : null;
    const median = deltas.length > 0
      ? deltas.length % 2 === 0
        ? Math.round((deltas[deltas.length / 2 - 1] + deltas[deltas.length / 2]) / 2)
        : deltas[Math.floor(deltas.length / 2)]
      : null;

    return {
      totalResponded: deltas.length,
      totalReceived,
      responseRate: totalReceived > 0 ? Math.round((deltas.length / totalReceived) * 100) : 0,
      avgResponseTimeMs: avg,
      medianResponseTimeMs: median,
      fastestResponseTimeMs: deltas.length > 0 ? deltas[0] : null,
      slowestResponseTimeMs: deltas.length > 0 ? deltas[deltas.length - 1] : null,
    };
  }

  // ── Metrics Breakdown ──────────────────────────────────

  async getMetricsBreakdown(userId: string) {
    const vendor = await this.prisma.vendor.findUnique({ where: { userId } });
    if (!vendor) throw new NotFoundException('Vendor profile not found');

    const totalReceived = await this.prisma.requestVendorMatch.count({
      where: { vendorId: vendor.id },
    });
    const accepted = await this.prisma.requestVendorMatch.count({
      where: { vendorId: vendor.id, responded: true },
    });
    const declined = await this.prisma.requestVendorMatch.count({
      where: { vendorId: vendor.id, declined: true },
    });
    const unanswered = totalReceived - accepted - declined;
    const acceptanceRate = totalReceived > 0 ? Math.round((accepted / totalReceived) * 100) : 0;

    return { totalReceived, accepted, declined, unanswered, acceptanceRate };
  }

  // ── Quick Replies ──────────────────────────────────────

  private readonly DEFAULT_QUICK_REPLIES = [
    'Sí, lo tengo disponible',
    '¿Cuántas unidades necesitas?',
    'El precio es $[ ]',
    'Tengo envío gratis',
    'Lo tengo original',
    '¿Dónde te encuentras?',
    'Perfecto, quedamos así entonces',
  ];

  private async getVendorId(userId: string): Promise<string> {
    const vendor = await this.prisma.vendor.findUnique({ where: { userId }, select: { id: true } });
    if (!vendor) throw new NotFoundException('Vendor profile not found');
    return vendor.id;
  }

  async getQuickReplies(userId: string) {
    const vendorId = await this.getVendorId(userId);

    let replies = await this.prisma.quickReply.findMany({
      where: { vendorId },
      orderBy: { order: 'asc' },
    });

    // Seed defaults if none exist
    if (replies.length === 0) {
      await this.prisma.quickReply.createMany({
        data: this.DEFAULT_QUICK_REPLIES.map((text, idx) => ({
          vendorId,
          messageText: text,
          order: idx,
        })),
      });
      replies = await this.prisma.quickReply.findMany({
        where: { vendorId },
        orderBy: { order: 'asc' },
      });
    }

    return replies.map((r: any) => ({
      id: r.id,
      messageText: r.messageText,
      order: r.order,
    }));
  }

  async createQuickReply(userId: string, messageText: string) {
    const vendorId = await this.getVendorId(userId);

    const maxOrder = await this.prisma.quickReply.aggregate({
      where: { vendorId },
      _max: { order: true },
    });

    const reply = await this.prisma.quickReply.create({
      data: {
        vendorId,
        messageText,
        order: (maxOrder._max.order ?? -1) + 1,
      },
    });

    return { id: reply.id, messageText: reply.messageText, order: reply.order };
  }

  async updateQuickReply(userId: string, replyId: string, messageText: string) {
    const vendorId = await this.getVendorId(userId);

    const reply = await this.prisma.quickReply.findFirst({
      where: { id: replyId, vendorId },
    });
    if (!reply) throw new NotFoundException('Quick reply not found');

    const updated = await this.prisma.quickReply.update({
      where: { id: replyId },
      data: { messageText },
    });

    return { id: updated.id, messageText: updated.messageText, order: updated.order };
  }

  async deleteQuickReply(userId: string, replyId: string) {
    const vendorId = await this.getVendorId(userId);

    const reply = await this.prisma.quickReply.findFirst({
      where: { id: replyId, vendorId },
    });
    if (!reply) throw new NotFoundException('Quick reply not found');

    await this.prisma.quickReply.delete({ where: { id: replyId } });
    return { success: true };
  }

  async reorderQuickReplies(userId: string, items: { id: string; order: number }[]) {
    const vendorId = await this.getVendorId(userId);

    await this.prisma.$transaction(
      items.map((item) =>
        this.prisma.quickReply.updateMany({
          where: { id: item.id, vendorId },
          data: { order: item.order },
        }),
      ),
    );

    return this.getQuickReplies(userId);
  }
}
