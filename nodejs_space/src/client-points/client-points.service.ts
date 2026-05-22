import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';

export const POINT_ACTIONS = {
  RATE_VENDOR: 'RATE_VENDOR',
  RATE_COMMENT: 'RATE_COMMENT',
  CREATE_REQUEST: 'CREATE_REQUEST',
  FIRST_RATING: 'FIRST_RATING',
} as const;

const POINTS_MAP: Record<string, number> = {
  [POINT_ACTIONS.RATE_VENDOR]: 20,
  [POINT_ACTIONS.RATE_COMMENT]: 10,
  [POINT_ACTIONS.CREATE_REQUEST]: 5,
  [POINT_ACTIONS.FIRST_RATING]: 30,
};

const MAX_DAILY_REQUEST_POINTS = 5; // max 5 requests per day give points

export interface ClientLevel {
  level: 'EXPLORADOR' | 'RODANTE' | 'AFINADOR' | 'MAESTRO';
  emoji: string;
  label: string;
  minPoints: number;
  maxPoints: number | null;
}

const LEVELS: ClientLevel[] = [
  { level: 'EXPLORADOR', emoji: '🧭', label: 'Explorador', minPoints: 0, maxPoints: 199 },
  { level: 'RODANTE', emoji: '🛞', label: 'Rodante', minPoints: 200, maxPoints: 799 },
  { level: 'AFINADOR', emoji: '🔧', label: 'Afinador', minPoints: 800, maxPoints: 1499 },
  { level: 'MAESTRO', emoji: '🏆', label: 'Maestro', minPoints: 1500, maxPoints: null },
];

@Injectable()
export class ClientPointsService {
  private readonly logger = new Logger(ClientPointsService.name);

  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  getLevel(totalPoints: number): ClientLevel {
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (totalPoints >= LEVELS[i].minPoints) return LEVELS[i];
    }
    return LEVELS[0];
  }

  getNextLevel(totalPoints: number): ClientLevel | null {
    const current = this.getLevel(totalPoints);
    const idx = LEVELS.findIndex((l) => l.level === current.level);
    return idx < LEVELS.length - 1 ? LEVELS[idx + 1] : null;
  }

  async getTotalPoints(userId: string): Promise<number> {
    const result = await this.prisma.clientPointLog.aggregate({
      where: { userId },
      _sum: { points: true },
    });
    return result?._sum?.points ?? 0;
  }

  async getClientPointsSummary(userId: string) {
    const totalPoints = await this.getTotalPoints(userId);
    const currentLevel = this.getLevel(totalPoints);
    const nextLevel = this.getNextLevel(totalPoints);

    // Stats
    const [totalRatings, totalRequests, recentLogs] = await Promise.all([
      this.prisma.clientPointLog.count({
        where: { userId, action: POINT_ACTIONS.RATE_VENDOR },
      }),
      this.prisma.clientPointLog.count({
        where: { userId, action: POINT_ACTIONS.CREATE_REQUEST },
      }),
      this.prisma.clientPointLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: { id: true, action: true, points: true, requestId: true, createdAt: true },
      }),
    ]);

    return {
      totalPoints,
      currentLevel: {
        level: currentLevel.level,
        emoji: currentLevel.emoji,
        label: currentLevel.label,
      },
      nextLevel: nextLevel
        ? {
            level: nextLevel.level,
            emoji: nextLevel.emoji,
            label: nextLevel.label,
            pointsRequired: nextLevel.minPoints,
            pointsRemaining: nextLevel.minPoints - totalPoints,
          }
        : null,
      stats: {
        totalRatings,
        totalRequests,
      },
      recentActivity: recentLogs,
    };
  }

  /** Get level info for a user (used by vendor-facing endpoints) */
  async getClientLevelForUser(userId: string): Promise<{ level: string; emoji: string; label: string }> {
    const totalPoints = await this.getTotalPoints(userId);
    const lvl = this.getLevel(totalPoints);
    return { level: lvl.level, emoji: lvl.emoji, label: lvl.label };
  }

  /** Award points for creating a request (max 5/day) */
  async awardCreateRequest(userId: string, requestId: string): Promise<void> {
    try {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const todayCount = await this.prisma.clientPointLog.count({
        where: {
          userId,
          action: POINT_ACTIONS.CREATE_REQUEST,
          createdAt: { gte: startOfDay },
        },
      });

      if (todayCount >= MAX_DAILY_REQUEST_POINTS) {
        this.logger.debug(`User ${userId} hit daily request points cap`);
        return;
      }

      await this.prisma.clientPointLog.create({
        data: {
          userId,
          action: POINT_ACTIONS.CREATE_REQUEST,
          points: POINTS_MAP[POINT_ACTIONS.CREATE_REQUEST],
          requestId,
        },
      });
    } catch (err) {
      this.logger.error('Error awarding create request points', err);
    }
  }

  /** Award points for rating a vendor */
  async awardRating(userId: string, requestId: string, hasComment: boolean): Promise<{ pointsAwarded: number; bonusFirstRating: boolean }> {
    let totalAwarded = 0;
    let bonusFirstRating = false;

    // Check if this is the user's first ever rating
    const previousRatings = await this.prisma.clientPointLog.count({
      where: { userId, action: POINT_ACTIONS.RATE_VENDOR },
    });

    // +20 for rating
    await this.prisma.clientPointLog.create({
      data: {
        userId,
        action: POINT_ACTIONS.RATE_VENDOR,
        points: POINTS_MAP[POINT_ACTIONS.RATE_VENDOR],
        requestId,
      },
    });
    totalAwarded += POINTS_MAP[POINT_ACTIONS.RATE_VENDOR];

    // +30 bonus for first rating ever
    if (previousRatings === 0) {
      await this.prisma.clientPointLog.create({
        data: {
          userId,
          action: POINT_ACTIONS.FIRST_RATING,
          points: POINTS_MAP[POINT_ACTIONS.FIRST_RATING],
          requestId,
        },
      });
      totalAwarded += POINTS_MAP[POINT_ACTIONS.FIRST_RATING];
      bonusFirstRating = true;
    }

    // +10 for comment >= 20 chars
    if (hasComment) {
      await this.prisma.clientPointLog.create({
        data: {
          userId,
          action: POINT_ACTIONS.RATE_COMMENT,
          points: POINTS_MAP[POINT_ACTIONS.RATE_COMMENT],
          requestId,
        },
      });
      totalAwarded += POINTS_MAP[POINT_ACTIONS.RATE_COMMENT];
    }

    return { pointsAwarded: totalAwarded, bonusFirstRating };
  }

  /** Send push reminders to clients who closed requests 24h+ ago without rating */
  async sendRatingReminders(): Promise<{ sent: number }> {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24h ago

    // Find closed requests without rating, with responses, closed >24h ago, no reminder sent yet
    const requests = await this.prisma.request.findMany({
      where: {
        status: 'CERRADA',
        closedAt: { lte: cutoff },
        ratingReminderSentAt: null,
        requestRating: null, // no rating exists
        requestVendorMatches: { some: { responded: true } }, // at least one vendor responded
      },
      select: {
        id: true,
        clientId: true,
        vehicleBrand: { select: { name: true } },
        partCategory: { select: { name: true } },
      },
      take: 50, // batch limit
    });

    if (requests.length === 0) {
      this.logger.debug('No pending rating reminders to send');
      return { sent: 0 };
    }

    let sent = 0;
    for (const req of requests) {
      try {
        const brandName = req.vehicleBrand?.name ?? '';
        const partName = req.partCategory?.name ?? '';

        await this.notificationService.sendToUser(
          req.clientId,
          '⭐ ¡Califica al vendedor!',
          `Tu solicitud de ${brandName} - ${partName} fue cerrada hace más de 24h. ¡Califica y gana puntos!`,
          {
            type: 'RATING_REMINDER',
            requestId: req.id,
          },
        );

        await this.prisma.request.update({
          where: { id: req.id },
          data: { ratingReminderSentAt: new Date() },
        });

        sent++;
      } catch (err) {
        this.logger.error(`Failed to send rating reminder for request ${req.id}`, err);
      }
    }

    this.logger.log(`Sent ${sent} rating reminder push notifications`);
    return { sent };
  }
}
