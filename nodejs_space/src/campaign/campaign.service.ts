import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { SendCampaignDto } from './dto/send-campaign.dto';

type TargetFilter = {
  role?: string | null;
  platform?: string | null;
  userIds?: string[] | null;
};

@Injectable()
export class CampaignService {
  private readonly logger = new Logger(CampaignService.name);

  constructor(
    private readonly prisma: PrismaService,
    // NotificationModule es @Global(), NotificationService está disponible.
    private readonly notification: NotificationService,
  ) {}

  // ── Envío directo (endpoint POST /api/admin/campaigns) ──
  async send(dto: SendCampaignDto) {
    const userIds = await this.resolveTargets({
      role: dto.role,
      platform: dto.platform,
      userIds: dto.userIds,
    });

    if (userIds.length === 0) {
      this.logger.log('Campaña sin destinatarios (ningún usuario coincide)');
      return {
        success: true,
        targeted: 0,
        message: 'Ningún usuario coincide con el filtro seleccionado',
      };
    }

    const data: Record<string, any> = { type: 'CAMPAIGN' };
    if (dto.actionUrl) data.url = dto.actionUrl;

    // Reutiliza el flujo push probado: chunking de 100 + limpieza de tokens inválidos.
    await this.notification.sendToMultiple(userIds, dto.title, dto.body, data);

    this.logger.log(
      `Campaña "${dto.title}" enviada a ${userIds.length} usuario(s)`,
    );
    return { success: true, targeted: userIds.length };
  }

  // ── Procesamiento de campañas programadas (llamado por cron) ──
  // Busca campañas SCHEDULED cuya hora ya llegó, las envía y actualiza su estado.
  async processScheduled() {
    const now = new Date();

    const due = await this.prisma.pushCampaign.findMany({
      where: { status: 'SCHEDULED', scheduledAt: { lte: now } },
      orderBy: { scheduledAt: 'asc' },
      take: 10, // procesar en lotes de 10 máximo
    });

    if (due.length === 0) {
      return { success: true, processed: 0, results: [] };
    }

    const results: Array<{
      id: string;
      status: string;
      targeted?: number;
      error?: string;
    }> = [];

    for (const c of due) {
      try {
        const userIds = await this.resolveTargets({
          role: c.role,
          platform: c.platform,
          userIds: Array.isArray(c.userIds) ? (c.userIds as string[]) : null,
        });

        const data: Record<string, any> = { type: 'CAMPAIGN' };
        if (c.actionUrl) data.url = c.actionUrl;

        if (userIds.length > 0) {
          await this.notification.sendToMultiple(userIds, c.title, c.body, data);
        }

        await this.prisma.pushCampaign.update({
          where: { id: c.id },
          data: { status: 'SENT', sentAt: new Date(), targeted: userIds.length },
        });

        this.logger.log(
          `Campaña programada ${c.id} enviada a ${userIds.length} usuario(s)`,
        );
        results.push({ id: c.id, status: 'SENT', targeted: userIds.length });
      } catch (err: any) {
        const message = err?.message ?? 'Error desconocido';
        this.logger.error(`Campaña programada ${c.id} falló: ${message}`);
        await this.prisma.pushCampaign
          .update({ where: { id: c.id }, data: { status: 'FAILED' } })
          .catch(() => {});
        results.push({ id: c.id, status: 'FAILED', error: message });
      }
    }

    return { success: true, processed: results.length, results };
  }

  // ── Resuelve la lista de userIds destino según filtros ──
  private async resolveTargets(filter: TargetFilter): Promise<string[]> {
    // 1) Lista explícita de usuarios tiene prioridad.
    if (filter.userIds && filter.userIds.length > 0) {
      return Array.from(new Set(filter.userIds));
    }

    // 2) Filtro opcional de plataforma sobre los push tokens.
    const tokenWhere: Record<string, any> = {};
    if (filter.platform && filter.platform !== 'ALL') {
      tokenWhere.platform = filter.platform;
    }

    // 3) Usuarios activos, con al menos un token (de la plataforma pedida) y del rol pedido.
    const users = await this.prisma.user.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        pushTokens: { some: tokenWhere },
        ...(filter.role && filter.role !== 'ALL'
          ? { userRoles: { some: { role: { name: filter.role } } } }
          : {}),
      },
      select: { id: true },
    });

    return users.map((u: { id: string }) => u.id);
  }
}
