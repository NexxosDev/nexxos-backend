"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ClientPointsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientPointsService = exports.POINT_ACTIONS = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const notification_service_1 = require("../notification/notification.service");
exports.POINT_ACTIONS = {
    RATE_VENDOR: 'RATE_VENDOR',
    RATE_COMMENT: 'RATE_COMMENT',
    CREATE_REQUEST: 'CREATE_REQUEST',
    FIRST_RATING: 'FIRST_RATING',
};
const POINTS_MAP = {
    [exports.POINT_ACTIONS.RATE_VENDOR]: 20,
    [exports.POINT_ACTIONS.RATE_COMMENT]: 10,
    [exports.POINT_ACTIONS.CREATE_REQUEST]: 5,
    [exports.POINT_ACTIONS.FIRST_RATING]: 30,
};
const MAX_DAILY_REQUEST_POINTS = 5;
const LEVELS = [
    { level: 'EXPLORADOR', emoji: '🧭', label: 'Explorador', minPoints: 0, maxPoints: 199 },
    { level: 'RODANTE', emoji: '🛞', label: 'Rodante', minPoints: 200, maxPoints: 799 },
    { level: 'AFINADOR', emoji: '🔧', label: 'Afinador', minPoints: 800, maxPoints: 1499 },
    { level: 'MAESTRO', emoji: '🏆', label: 'Maestro', minPoints: 1500, maxPoints: null },
];
let ClientPointsService = ClientPointsService_1 = class ClientPointsService {
    prisma;
    notificationService;
    logger = new common_1.Logger(ClientPointsService_1.name);
    constructor(prisma, notificationService) {
        this.prisma = prisma;
        this.notificationService = notificationService;
    }
    getLevel(totalPoints) {
        for (let i = LEVELS.length - 1; i >= 0; i--) {
            if (totalPoints >= LEVELS[i].minPoints)
                return LEVELS[i];
        }
        return LEVELS[0];
    }
    getNextLevel(totalPoints) {
        const current = this.getLevel(totalPoints);
        const idx = LEVELS.findIndex((l) => l.level === current.level);
        return idx < LEVELS.length - 1 ? LEVELS[idx + 1] : null;
    }
    async getTotalPoints(userId) {
        const result = await this.prisma.clientPointLog.aggregate({
            where: { userId },
            _sum: { points: true },
        });
        return result?._sum?.points ?? 0;
    }
    async getClientPointsSummary(userId) {
        const totalPoints = await this.getTotalPoints(userId);
        const currentLevel = this.getLevel(totalPoints);
        const nextLevel = this.getNextLevel(totalPoints);
        const [totalRatings, totalRequests, recentLogs] = await Promise.all([
            this.prisma.clientPointLog.count({
                where: { userId, action: exports.POINT_ACTIONS.RATE_VENDOR },
            }),
            this.prisma.request.count({
                where: { clientId: userId },
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
    async getClientLevelForUser(userId) {
        const totalPoints = await this.getTotalPoints(userId);
        const lvl = this.getLevel(totalPoints);
        return { level: lvl.level, emoji: lvl.emoji, label: lvl.label };
    }
    async awardCreateRequest(userId, requestId) {
        try {
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);
            const todayCount = await this.prisma.clientPointLog.count({
                where: {
                    userId,
                    action: exports.POINT_ACTIONS.CREATE_REQUEST,
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
                    action: exports.POINT_ACTIONS.CREATE_REQUEST,
                    points: POINTS_MAP[exports.POINT_ACTIONS.CREATE_REQUEST],
                    requestId,
                },
            });
        }
        catch (err) {
            this.logger.error('Error awarding create request points', err);
        }
    }
    async awardRating(userId, requestId, hasComment) {
        let totalAwarded = 0;
        let bonusFirstRating = false;
        const previousRatings = await this.prisma.clientPointLog.count({
            where: { userId, action: exports.POINT_ACTIONS.RATE_VENDOR },
        });
        await this.prisma.clientPointLog.create({
            data: {
                userId,
                action: exports.POINT_ACTIONS.RATE_VENDOR,
                points: POINTS_MAP[exports.POINT_ACTIONS.RATE_VENDOR],
                requestId,
            },
        });
        totalAwarded += POINTS_MAP[exports.POINT_ACTIONS.RATE_VENDOR];
        if (previousRatings === 0) {
            await this.prisma.clientPointLog.create({
                data: {
                    userId,
                    action: exports.POINT_ACTIONS.FIRST_RATING,
                    points: POINTS_MAP[exports.POINT_ACTIONS.FIRST_RATING],
                    requestId,
                },
            });
            totalAwarded += POINTS_MAP[exports.POINT_ACTIONS.FIRST_RATING];
            bonusFirstRating = true;
        }
        if (hasComment) {
            await this.prisma.clientPointLog.create({
                data: {
                    userId,
                    action: exports.POINT_ACTIONS.RATE_COMMENT,
                    points: POINTS_MAP[exports.POINT_ACTIONS.RATE_COMMENT],
                    requestId,
                },
            });
            totalAwarded += POINTS_MAP[exports.POINT_ACTIONS.RATE_COMMENT];
        }
        return { pointsAwarded: totalAwarded, bonusFirstRating };
    }
    async sendRatingReminders() {
        const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const requests = await this.prisma.request.findMany({
            where: {
                status: 'CERRADA',
                closedAt: { lte: cutoff },
                ratingReminderSentAt: null,
                requestRating: null,
                requestVendorMatches: { some: { responded: true } },
            },
            select: {
                id: true,
                clientId: true,
                vehicleBrand: { select: { name: true } },
                partCategory: { select: { name: true } },
            },
            take: 50,
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
                await this.notificationService.sendToUser(req.clientId, '⭐ ¡Califica al vendedor!', `Tu solicitud de ${brandName} - ${partName} fue cerrada hace más de 24h. ¡Califica y gana puntos!`, {
                    type: 'RATING_REMINDER',
                    requestId: req.id,
                });
                await this.prisma.request.update({
                    where: { id: req.id },
                    data: { ratingReminderSentAt: new Date() },
                });
                sent++;
            }
            catch (err) {
                this.logger.error(`Failed to send rating reminder for request ${req.id}`, err);
            }
        }
        this.logger.log(`Sent ${sent} rating reminder push notifications`);
        return { sent };
    }
};
exports.ClientPointsService = ClientPointsService;
exports.ClientPointsService = ClientPointsService = ClientPointsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notification_service_1.NotificationService])
], ClientPointsService);
//# sourceMappingURL=client-points.service.js.map