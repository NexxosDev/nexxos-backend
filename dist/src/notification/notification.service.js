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
var NotificationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let NotificationService = NotificationService_1 = class NotificationService {
    prisma;
    logger = new common_1.Logger(NotificationService_1.name);
    expo;
    ExpoClass;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async onModuleInit() {
        try {
            const expoModule = await Function('return import("expo-server-sdk")')();
            this.ExpoClass = expoModule.default || expoModule.Expo || expoModule;
            this.expo = new this.ExpoClass();
            this.logger.log('Expo Push SDK initialized');
        }
        catch (err) {
            this.logger.error('Failed to load expo-server-sdk', err);
        }
    }
    async registerToken(userId, token, platform) {
        if (this.ExpoClass && !this.ExpoClass.isExpoPushToken(token)) {
            this.logger.warn(`Invalid Expo push token: ${token}`);
            return { success: false, message: 'Invalid Expo push token' };
        }
        await this.prisma.pushToken.upsert({
            where: { token },
            update: { userId, platform, updatedAt: new Date() },
            create: { userId, token, platform },
        });
        this.logger.log(`Push token registered for user ${userId} (${platform})`);
        return { success: true };
    }
    async removeToken(token) {
        try {
            await this.prisma.pushToken.deleteMany({ where: { token } });
        }
        catch {
        }
        return { success: true };
    }
    getNotificationMeta(data) {
        const type = data?.type;
        switch (type) {
            case 'NEW_MESSAGE':
                return { channelId: 'messages', categoryIdentifier: 'MESSAGE' };
            case 'NEW_REQUEST':
                return { channelId: 'requests', categoryIdentifier: 'REQUEST' };
            case 'NEW_RESPONSE':
                return { channelId: 'requests', categoryIdentifier: 'REQUEST' };
            case 'REQUEST_CLOSED':
                return { channelId: 'requests', categoryIdentifier: 'REQUEST' };
            case 'RATING_RECEIVED':
                return { channelId: 'ratings', categoryIdentifier: 'RATING' };
            case 'RATING_REMINDER':
                return { channelId: 'ratings', categoryIdentifier: 'RATING' };
            default:
                return { channelId: 'default', categoryIdentifier: 'DEFAULT' };
        }
    }
    async sendToUser(userId, title, body, data) {
        const tokens = await this.prisma.pushToken.findMany({
            where: { userId },
            select: { token: true },
        });
        if (tokens.length === 0) {
            this.logger.debug(`No push tokens for user ${userId}, skipping notification`);
            return;
        }
        const { channelId, categoryIdentifier } = this.getNotificationMeta(data);
        const messages = tokens.map((t) => ({
            to: t.token,
            sound: 'default',
            title,
            body,
            data: data ?? {},
            priority: 'high',
            channelId,
            categoryIdentifier,
        }));
        await this.sendMessages(messages);
    }
    async sendToMultiple(userIds, title, body, data) {
        if (userIds.length === 0)
            return;
        const tokens = await this.prisma.pushToken.findMany({
            where: { userId: { in: userIds } },
            select: { token: true },
        });
        if (tokens.length === 0)
            return;
        const { channelId, categoryIdentifier } = this.getNotificationMeta(data);
        const messages = tokens.map((t) => ({
            to: t.token,
            sound: 'default',
            title,
            body,
            data: data ?? {},
            priority: 'high',
            channelId,
            categoryIdentifier,
        }));
        await this.sendMessages(messages);
    }
    async sendMessages(messages) {
        if (!this.expo) {
            this.logger.warn('Expo Push SDK not initialized, skipping send');
            return;
        }
        const chunks = this.expo.chunkPushNotifications(messages);
        const tickets = [];
        for (const chunk of chunks) {
            try {
                const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
                tickets.push(...ticketChunk);
            }
            catch (error) {
                this.logger.error('Error sending push notification chunk', error);
            }
        }
        const invalidTokens = [];
        for (let i = 0; i < tickets.length; i++) {
            const ticket = tickets[i];
            if (ticket?.status === 'error') {
                const details = ticket?.details;
                if (details?.error === 'DeviceNotRegistered') {
                    const msg = messages[i];
                    const tokenStr = typeof msg?.to === 'string' ? msg.to : msg?.to?.[0];
                    if (tokenStr)
                        invalidTokens.push(tokenStr);
                }
            }
        }
        if (invalidTokens.length > 0) {
            this.logger.log(`Removing ${invalidTokens.length} invalid push tokens`);
            await this.prisma.pushToken.deleteMany({
                where: { token: { in: invalidTokens } },
            });
        }
        this.logger.log(`Sent ${tickets.length} push notifications, ${invalidTokens.length} invalid tokens removed`);
    }
};
exports.NotificationService = NotificationService;
exports.NotificationService = NotificationService = NotificationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NotificationService);
//# sourceMappingURL=notification.service.js.map