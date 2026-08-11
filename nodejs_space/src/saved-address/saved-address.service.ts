import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertSavedAddressDto, SAVED_ADDRESS_LABELS } from './dto/upsert-saved-address.dto';

@Injectable()
export class SavedAddressService {
  private readonly logger = new Logger(SavedAddressService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Lista todas las direcciones guardadas del usuario (Casa/Taller/Oficina).
  async list(userId: string) {
    const rows = await this.prisma.savedAddress.findMany({
      where: { userId },
      orderBy: { label: 'asc' },
    });
    return (rows ?? []).map((r) => ({
      id: r.id,
      label: r.label,
      address: r.address ?? '',
      latitude: r.latitude ?? null,
      longitude: r.longitude ?? null,
    }));
  }

  // Crea o actualiza (upsert por usuario+etiqueta) una dirección guardada.
  async upsert(userId: string, dto: UpsertSavedAddressDto) {
    const label = dto?.label;
    const row = await this.prisma.savedAddress.upsert({
      where: { userId_label: { userId, label } },
      update: {
        address: dto?.address ?? null,
        latitude: dto?.latitude ?? null,
        longitude: dto?.longitude ?? null,
      },
      create: {
        userId,
        label,
        address: dto?.address ?? null,
        latitude: dto?.latitude ?? null,
        longitude: dto?.longitude ?? null,
      },
    });
    return {
      id: row.id,
      label: row.label,
      address: row.address ?? '',
      latitude: row.latitude ?? null,
      longitude: row.longitude ?? null,
    };
  }

  // Elimina una dirección guardada del usuario por etiqueta.
  async removeByLabel(userId: string, label: string) {
    if (!SAVED_ADDRESS_LABELS.includes(label as any)) {
      return { success: true };
    }
    await this.prisma.savedAddress.deleteMany({ where: { userId, label } });
    return { success: true };
  }
}
