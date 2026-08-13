import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReportDto } from './dto/create-report.dto';
import { CreateBlockDto } from './dto/create-block.dto';

@Injectable()
export class ModerationService {
  private readonly logger = new Logger(ModerationService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Crea un reporte de contenido/usuario objetable (UGC).
  async createReport(reporterId: string, dto: CreateReportDto) {
    const reportedUserId = dto?.reportedUserId ?? null;
    if (reportedUserId && reportedUserId === reporterId) {
      throw new BadRequestException('No puedes reportarte a ti mismo.');
    }
    const report = await this.prisma.report.create({
      data: {
        reporterId,
        reportedUserId,
        targetType: dto?.targetType,
        targetId: dto?.targetId ?? null,
        reason: dto?.reason ?? '',
        details: dto?.details ?? null,
        status: 'pending',
      },
      select: { id: true, createdAt: true },
    });
    this.logger.log(`Reporte creado: ${report.id} por ${reporterId} (tipo=${dto?.targetType})`);
    return { id: report.id, createdAt: report.createdAt.toISOString(), message: 'Reporte enviado. Nuestro equipo lo revisará.' };
  }

  // Lista los IDs de usuarios que el usuario actual ha bloqueado.
  async listBlocks(userId: string) {
    const rows = await this.prisma.userBlock.findMany({
      where: { blockerId: userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        blockedId: true,
        createdAt: true,
        blocked: { select: { name: true, profileImageUrl: true } },
      },
    });
    return (rows ?? []).map((r) => ({
      id: r.id,
      blockedUserId: r.blockedId,
      name: r.blocked?.name ?? '',
      profileImageUrl: r.blocked?.profileImageUrl ?? null,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  // Bloquea a un usuario (idempotente).
  async blockUser(blockerId: string, dto: CreateBlockDto) {
    const blockedId = dto?.blockedUserId ?? '';
    if (!blockedId) throw new BadRequestException('blockedUserId es requerido.');
    if (blockedId === blockerId) throw new BadRequestException('No puedes bloquearte a ti mismo.');

    const target = await this.prisma.user.findUnique({ where: { id: blockedId }, select: { id: true } });
    if (!target) throw new NotFoundException('Usuario no encontrado.');

    await this.prisma.userBlock.upsert({
      where: { blockerId_blockedId: { blockerId, blockedId } },
      update: {},
      create: { blockerId, blockedId },
    });
    this.logger.log(`Usuario ${blockerId} bloqueó a ${blockedId}`);
    return { blocked: true, blockedUserId: blockedId };
  }

  // Desbloquea a un usuario.
  async unblockUser(blockerId: string, blockedId: string) {
    await this.prisma.userBlock.deleteMany({ where: { blockerId, blockedId } });
    this.logger.log(`Usuario ${blockerId} desbloqueó a ${blockedId}`);
    return { blocked: false, blockedUserId: blockedId };
  }

  // Devuelve true si existe un bloqueo en cualquier dirección entre dos usuarios.
  async isBlockedBetween(a: string, b: string): Promise<boolean> {
    if (!a || !b) return false;
    const found = await this.prisma.userBlock.findFirst({
      where: {
        OR: [
          { blockerId: a, blockedId: b },
          { blockerId: b, blockedId: a },
        ],
      },
      select: { id: true },
    });
    return !!found;
  }
}
