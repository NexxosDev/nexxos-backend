import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { SendCampaignDto } from './dto/send-campaign.dto';

@Injectable()
export class CampaignService {
  private readonly logger = new Logger(CampaignService.name);

  constructor(
    private readonly prisma: PrismaService,
    // NotificationModule es @Global(), NotificationService está disponible.
    private readonly notification: NotificationService,
  ) {}

  async send(dto: SendCampaignDto) {
    const userIds = await this.resolveTargets(dto);

    if (userIds.length === 0) {
      this.logger.log('Campaña sin destinatarios (ningún usuario coincide)');
      return {
        success: true,
        targeted: 0,
        message: 'Ningún usuario coincide con el filtro seleccionado',
      };
    }

    // Reutiliza el flujo push probado: chunking de 100 + limpieza de tokens inválidos.
    await this.notification.sendToMultiple(userIds, dto.title, dto.body, {
      type: 'CAMPAIGN',
    });

    this.logger.log(`Campaña "${dto.title}" enviada a ${userIds.length} usuario(s)`);
    return { success: true, targeted: userIds.length };
  }

  private async resolveTargets(dto: SendCampaignDto): Promise<string[]> {
    // 1) Lista explícita de usuarios tiene prioridad.
    if (dto.userIds && dto.userIds.length > 0) {
      return Array.from(new Set(dto.userIds));
    }

    // 2) Filtro opcional de plataforma sobre los push tokens.
    const tokenWhere: Record<string, any> = {};
    if (dto.platform && dto.platform !== 'ALL') {
      tokenWhere.platform = dto.platform;
    }

    // 3) Usuarios activos, con al menos un token (de la plataforma pedida) y del rol pedido.
    const users = await this.prisma.user.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        pushTokens: { some: tokenWhere },
        ...(dto.role && dto.role !== 'ALL'
          ? { userRoles: { some: { role: { name: dto.role } } } }
          : {}),
      },
      select: { id: true },
    });

    return users.map((u) => u.id);
  }
}
