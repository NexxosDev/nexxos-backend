import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationService implements OnModuleInit {
  private readonly logger = new Logger(NotificationService.name);
  private expo: any;
  private ExpoClass: any;

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    try {
      const expoModule = await (Function('return import("expo-server-sdk")')() as Promise<any>);
      this.ExpoClass = expoModule.default || expoModule.Expo || expoModule;
      this.expo = new this.ExpoClass();
      this.logger.log('Expo Push SDK initialized');
    } catch (err) {
      this.logger.error('Failed to load expo-server-sdk', err);
    }
  }

  // ── Register / update push token ──
  async registerToken(userId: string, token: string, platform: string) {
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

  // ── Remove push token (logout) ──
  async removeToken(token: string) {
    try {
      await this.prisma.pushToken.deleteMany({ where: { token } });
    } catch {
      // Token may not exist, that's OK
    }
    return { success: true };
  }

  // ── Resolve channel & category from notification type ──
  private getNotificationMeta(data?: Record<string, any>) {
    const type = data?.type as string | undefined;
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

  // ── Send notification to a single user ──
  async sendToUser(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, any>,
  ) {
    const tokens = await this.prisma.pushToken.findMany({
      where: { userId },
      select: { token: true },
    });

    if (tokens.length === 0) {
      this.logger.debug(`No push tokens for user ${userId}, skipping notification`);
      return;
    }

    const { channelId, categoryIdentifier } = this.getNotificationMeta(data);

    const messages = tokens.map((t: any) => ({
      to: t.token,
      sound: 'default' as const,
      title,
      body,
      data: data ?? {},
      priority: 'high' as const,
      channelId,
      categoryIdentifier,
    }));

    await this.sendMessages(messages);
  }

  // ── Send notification to multiple users ──
  async sendToMultiple(
    userIds: string[],
    title: string,
    body: string,
    data?: Record<string, any>,
  ) {
    if (userIds.length === 0) return;

    const tokens = await this.prisma.pushToken.findMany({
      where: { userId: { in: userIds } },
      select: { token: true },
    });

    if (tokens.length === 0) return;

    const { channelId, categoryIdentifier } = this.getNotificationMeta(data);

    const messages = tokens.map((t: any) => ({
      to: t.token,
      sound: 'default' as const,
      title,
      body,
      data: data ?? {},
      priority: 'high' as const,
      channelId,
      categoryIdentifier,
    }));

    await this.sendMessages(messages);
  }

  // ── Internal: send + handle receipts ──
  private async sendMessages(messages: any[]) {
    if (!this.expo) {
      this.logger.warn('Expo Push SDK not initialized, skipping send');
      return;
    }
    const chunks = this.expo.chunkPushNotifications(messages);
    const tickets: any[] = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        this.logger.error('Error sending push notification chunk', error);
      }
    }

    // Clean up invalid tokens
    const invalidTokens: string[] = [];
    for (let i = 0; i < tickets.length; i++) {
      const ticket = tickets[i];
      if ((ticket as any)?.status === 'error') {
        const details = (ticket as any)?.details;
        if (details?.error === 'DeviceNotRegistered') {
          const msg = messages[i];
          const tokenStr = typeof msg?.to === 'string' ? msg.to : msg?.to?.[0];
          if (tokenStr) invalidTokens.push(tokenStr);
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
}
