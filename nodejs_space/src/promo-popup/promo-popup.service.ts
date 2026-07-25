import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Fecha "hoy" en horario de Venezuela (America/Caracas), formato YYYY-MM-DD.
// Se usa para el capping "una vez por día".
function caracasToday(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Caracas',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

type PopupPayload = {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string | null;
  ctaText: string | null;
  actionUrl: string | null;
};

@Injectable()
export class PromoPopupService {
  private readonly logger = new Logger(PromoPopupService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Devuelve el popup activo y vigente que el sujeto (usuario o dispositivo)
  // aún no ha visto hoy. Si no hay ninguno, devuelve { popup: null }.
  async getActive(subject: string | null): Promise<{ popup: PopupPayload | null }> {
    const now = new Date();

    const candidates = await this.prisma.promoPopup.findMany({
      where: {
        enabled: true,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
        ],
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      take: 10,
    });

    if (!candidates || candidates.length === 0) {
      return { popup: null };
    }

    // Sin sujeto no podemos aplicar capping: devolvemos el de mayor prioridad.
    if (!subject) {
      return { popup: this.serialize(candidates[0]) };
    }

    const today = caracasToday();
    const seen = await this.prisma.promoPopupView.findMany({
      where: {
        subject,
        seenDate: today,
        popupId: { in: candidates.map((c: { id: string }) => c.id) },
      },
      select: { popupId: true },
    });
    const seenSet = new Set((seen ?? []).map((s: { popupId: string }) => s.popupId));

    const unseen = candidates.find((c: { id: string }) => !seenSet.has(c.id));
    if (!unseen) {
      return { popup: null };
    }
    return { popup: this.serialize(unseen) };
  }

  // Registra que el sujeto vio el popup hoy (capping una vez por día).
  async markSeen(popupId: string, subject: string | null) {
    if (!subject) {
      return { success: true, skipped: true };
    }
    const today = caracasToday();
    try {
      await this.prisma.promoPopupView.upsert({
        where: {
          popupId_subject_seenDate: { popupId, subject, seenDate: today },
        },
        create: { popupId, subject, seenDate: today },
        update: {},
      });
      return { success: true };
    } catch (err: any) {
      this.logger.warn(`markSeen falló (${popupId}): ${err?.message ?? err}`);
      // No es crítico: el capping best-effort no debe romper la app.
      return { success: true, warning: 'no se pudo registrar la vista' };
    }
  }

  private serialize(p: any): PopupPayload {
    return {
      id: p?.id,
      title: p?.title ?? '',
      subtitle: p?.subtitle ?? '',
      imageUrl: p?.imageUrl ?? null,
      ctaText: p?.ctaText ?? null,
      actionUrl: p?.actionUrl ?? null,
    };
  }
}
