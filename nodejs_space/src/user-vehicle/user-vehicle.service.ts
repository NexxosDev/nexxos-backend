import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserVehicleDto } from './dto/create-user-vehicle.dto';
import { UpdateUserVehicleDto } from './dto/update-user-vehicle.dto';

export const MAX_USER_VEHICLES = 3;

type VehicleRow = {
  id: string;
  vehicleBrandId: string;
  vehicleModelId: string;
  year: number | null;
  nickname: string | null;
  isDefault: boolean;
  vehicleBrand?: { name: string | null } | null;
  vehicleModel?: { name: string | null } | null;
};

@Injectable()
export class UserVehicleService {
  private readonly logger = new Logger(UserVehicleService.name);

  constructor(private readonly prisma: PrismaService) {}

  private map(r: VehicleRow) {
    const brandName = r?.vehicleBrand?.name ?? '';
    const modelName = r?.vehicleModel?.name ?? '';
    const year = r?.year ?? null;
    const label = `${brandName} ${modelName}${year ? ` ${year}` : ''}`.trim();
    return {
      id: r.id,
      vehicleBrandId: r.vehicleBrandId,
      vehicleModelId: r.vehicleModelId,
      brandName,
      modelName,
      year,
      nickname: r?.nickname ?? null,
      isDefault: r?.isDefault ?? false,
      label,
    };
  }

  private readonly include = {
    vehicleBrand: { select: { name: true } },
    vehicleModel: { select: { name: true } },
  };

  // Lista los vehículos guardados del usuario (favorito primero, luego más recientes).
  async list(userId: string) {
    const rows = await this.prisma.userVehicle.findMany({
      where: { userId },
      include: this.include,
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
    return (rows ?? []).map((r) => this.map(r as VehicleRow));
  }

  // Valida que el modelo pertenezca a la marca indicada.
  private async assertBrandModel(vehicleBrandId: string, vehicleModelId: string) {
    const model = await this.prisma.vehicleModel.findUnique({
      where: { id: vehicleModelId },
      select: { id: true, brandId: true },
    });
    if (!model || model.brandId !== vehicleBrandId) {
      throw new BadRequestException('El modelo no corresponde a la marca seleccionada.');
    }
  }

  // Crea un vehículo nuevo (máx. 3, sin duplicados). El primero se marca favorito.
  async create(userId: string, dto: CreateUserVehicleDto) {
    const count = await this.prisma.userVehicle.count({ where: { userId } });
    if (count >= MAX_USER_VEHICLES) {
      throw new BadRequestException(`Solo puedes guardar hasta ${MAX_USER_VEHICLES} vehículos.`);
    }
    await this.assertBrandModel(dto.vehicleBrandId, dto.vehicleModelId);

    const duplicate = await this.prisma.userVehicle.findFirst({
      where: {
        userId,
        vehicleBrandId: dto.vehicleBrandId,
        vehicleModelId: dto.vehicleModelId,
        year: dto.year ?? null,
      },
      select: { id: true },
    });
    if (duplicate) {
      throw new BadRequestException('Ya tienes ese vehículo guardado.');
    }

    // El primer vehículo siempre queda como favorito.
    const makeDefault = count === 0 ? true : (dto.isDefault ?? false);
    if (makeDefault) {
      await this.prisma.userVehicle.updateMany({ where: { userId }, data: { isDefault: false } });
    }

    const row = await this.prisma.userVehicle.create({
      data: {
        userId,
        vehicleBrandId: dto.vehicleBrandId,
        vehicleModelId: dto.vehicleModelId,
        year: dto.year ?? null,
        nickname: dto.nickname?.trim() ? dto.nickname.trim() : null,
        isDefault: makeDefault,
      },
      include: this.include,
    });
    return this.map(row as VehicleRow);
  }

  // Actualiza un vehículo existente (verifica pertenencia).
  async update(userId: string, id: string, dto: UpdateUserVehicleDto) {
    const existing = await this.prisma.userVehicle.findFirst({ where: { id, userId } });
    if (!existing) {
      throw new NotFoundException('Vehículo no encontrado.');
    }

    const nextBrandId = dto.vehicleBrandId ?? existing.vehicleBrandId;
    const nextModelId = dto.vehicleModelId ?? existing.vehicleModelId;
    if (dto.vehicleBrandId || dto.vehicleModelId) {
      await this.assertBrandModel(nextBrandId, nextModelId);
    }

    // Evitar duplicados con otros vehículos del usuario.
    const nextYear = dto.year !== undefined ? (dto.year ?? null) : existing.year;
    const duplicate = await this.prisma.userVehicle.findFirst({
      where: {
        userId,
        vehicleBrandId: nextBrandId,
        vehicleModelId: nextModelId,
        year: nextYear,
        id: { not: id },
      },
      select: { id: true },
    });
    if (duplicate) {
      throw new BadRequestException('Ya tienes ese vehículo guardado.');
    }

    if (dto.isDefault === true) {
      await this.prisma.userVehicle.updateMany({ where: { userId }, data: { isDefault: false } });
    }

    const row = await this.prisma.userVehicle.update({
      where: { id },
      data: {
        vehicleBrandId: nextBrandId,
        vehicleModelId: nextModelId,
        year: nextYear,
        nickname: dto.nickname !== undefined ? (dto.nickname?.trim() ? dto.nickname.trim() : null) : existing.nickname,
        isDefault: dto.isDefault === true ? true : existing.isDefault,
      },
      include: this.include,
    });
    return this.map(row as VehicleRow);
  }

  // Elimina un vehículo (verifica pertenencia) y promueve otro a favorito si hacía falta.
  async remove(userId: string, id: string) {
    const existing = await this.prisma.userVehicle.findFirst({ where: { id, userId } });
    if (!existing) {
      throw new NotFoundException('Vehículo no encontrado.');
    }
    await this.prisma.userVehicle.delete({ where: { id } });

    if (existing.isDefault) {
      const next = await this.prisma.userVehicle.findFirst({
        where: { userId },
        orderBy: { createdAt: 'asc' },
        select: { id: true },
      });
      if (next) {
        await this.prisma.userVehicle.update({ where: { id: next.id }, data: { isDefault: true } });
      }
    }
    return { success: true };
  }
}
