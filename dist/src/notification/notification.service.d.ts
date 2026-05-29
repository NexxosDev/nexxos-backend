import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
export declare class NotificationService implements OnModuleInit {
    private readonly prisma;
    private readonly logger;
    private expo;
    private ExpoClass;
    constructor(prisma: PrismaService);
    onModuleInit(): Promise<void>;
    registerToken(userId: string, token: string, platform: string): Promise<{
        success: boolean;
        message: string;
    } | {
        success: boolean;
        message?: undefined;
    }>;
    removeToken(token: string): Promise<{
        success: boolean;
    }>;
    private getNotificationMeta;
    sendToUser(userId: string, title: string, body: string, data?: Record<string, any>): Promise<void>;
    sendToMultiple(userIds: string[], title: string, body: string, data?: Record<string, any>): Promise<void>;
    private sendMessages;
}
