import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { getFileUrl } from '../lib/s3';

@Injectable()
export class VendorService {
  private readonly logger = new Logger(VendorService.name);

  constructor(private readonly prisma: PrismaService) {}

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
      try { logoUrl = await getFileUrl(vendor.logoUrl, true); } catch { logoUrl = null; }
    }

    return {
      id: vendor.id,
      userId: vendor.userId,
      businessName: vendor.businessName,
      rif: vendor.rif,
      logoUrl,
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
      try { logoUrl = await getFileUrl(vendor.logoUrl, true); } catch { logoUrl = null; }
    }
    return {
      id: vendor.id,
      businessName: vendor.businessName,
      rif: vendor.rif,
      logoUrl,
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
      try { logoUrl = await getFileUrl(updated.logoUrl, true); } catch { logoUrl = null; }
    }

    return {
      id: updated.id,
      businessName: updated.businessName,
      rif: updated.rif,
      logoUrl,
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
      recentRequests: vendor.requestVendorMatches.map((m: any) => {
        const deliveredAt = m.deliveredAt ? m.deliveredAt.toISOString() : null;
        const respondedAt = m.respondedAt ? m.respondedAt.toISOString() : null;
        const declinedAt = m.declinedAt ? m.declinedAt.toISOString() : null;

        let status = 'PENDING';
        if (m.request.status === 'CERRADA') status = 'CERRADA';
        else if (m.declined) status = 'DECLINED';
        else if (m.responded) status = 'RESPONDED';

        return {
          matchId: m.id,
          request: {
            id: m.request.id,
            vehicleBrand: m.request.vehicleBrand.name,
            vehicleModel: m.request.vehicleModel.name,
            partCategory: m.request.partCategory.name,
            partSubcategory: m.request.partSubcategory?.name ?? null,
            municipality: m.request.municipality?.name ?? null,
            state: m.request.state?.name ?? null,
            createdAt: m.request.createdAt.toISOString(),
          },
          status,
          deliveredAt,
          respondedAt,
          declinedAt,
          responded: !!m.responded,
          declined: !!m.declined,
        };
      }),
    };
  }

  async getResponseTimeMetrics(userId: string) {
    const vendor = await this.prisma.vendor.findUnique({ where: { userId } });
    if (!vendor) throw new NotFoundException('Vendor profile not found');

    const matches = await this.prisma.requestVendorMatch.findMany({
      where: { vendorId: vendor.id, responded: true, respondedAt: { not: null } },
      select: { deliveredAt: true, respondedAt: true },
    });

    if (matches.length === 0) {
      return {
        totalResponded: 0,
        totalReceived: 0,
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

    const deltas = matches
      .filter((m: any) => m.respondedAt && m.deliveredAt)
      .map((m: any) => new Date(m.respondedAt).getTime() - new Date(m.deliveredAt).getTime())
      .filter((d: number) => d >= 0)
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
}
