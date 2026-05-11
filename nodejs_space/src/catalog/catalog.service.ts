import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async getStates() {
    const items = await this.prisma.state.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, capital: true, isoCode: true },
    });
    return { items };
  }

  async getMunicipalities(stateId?: string) {
    const where = stateId ? { stateId } : {};
    const items = await this.prisma.municipality.findMany({
      where,
      orderBy: { name: 'asc' },
      select: { id: true, name: true, stateId: true },
    });
    return { items };
  }

  async getParishes(municipalityId?: string) {
    const where = municipalityId ? { municipalityId } : {};
    const items = await this.prisma.parish.findMany({
      where,
      orderBy: { name: 'asc' },
      select: { id: true, name: true, municipalityId: true },
    });
    return { items };
  }

  async getVehicleBrands() {
    const items = await this.prisma.vehicleBrand.findMany({ orderBy: { name: 'asc' } });
    return { items };
  }

  async getVehicleModels(brandId?: string) {
    const where = brandId ? { brandId } : {};
    const items = await this.prisma.vehicleModel.findMany({
      where,
      orderBy: { name: 'asc' },
      select: { id: true, name: true, brandId: true },
    });
    return { items };
  }

  async getPartCategories() {
    const items = await this.prisma.partCategory.findMany({ orderBy: { name: 'asc' } });
    return { items };
  }

  async getPartSubcategories(categoryId?: string) {
    const where = categoryId ? { categoryId } : {};
    const items = await this.prisma.partSubcategory.findMany({
      where,
      orderBy: { name: 'asc' },
      select: { id: true, name: true, categoryId: true },
    });
    return { items };
  }
}
