import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
export declare const POINT_ACTIONS: {
    readonly RATE_VENDOR: "RATE_VENDOR";
    readonly RATE_COMMENT: "RATE_COMMENT";
    readonly CREATE_REQUEST: "CREATE_REQUEST";
    readonly FIRST_RATING: "FIRST_RATING";
};
export interface ClientLevel {
    level: 'EXPLORADOR' | 'RODANTE' | 'AFINADOR' | 'MAESTRO';
    emoji: string;
    label: string;
    minPoints: number;
    maxPoints: number | null;
}
export declare class ClientPointsService {
    private prisma;
    private notificationService;
    private readonly logger;
    constructor(prisma: PrismaService, notificationService: NotificationService);
    getLevel(totalPoints: number): ClientLevel;
    getNextLevel(totalPoints: number): ClientLevel | null;
    getTotalPoints(userId: string): Promise<number>;
    getClientPointsSummary(userId: string): Promise<{
        totalPoints: number;
        currentLevel: {
            level: "EXPLORADOR" | "RODANTE" | "AFINADOR" | "MAESTRO";
            emoji: string;
            label: string;
        };
        nextLevel: {
            level: "EXPLORADOR" | "RODANTE" | "AFINADOR" | "MAESTRO";
            emoji: string;
            label: string;
            pointsRequired: number;
            pointsRemaining: number;
        } | null;
        stats: {
            totalRatings: number;
            totalRequests: number;
        };
        recentActivity: {
            id: string;
            createdAt: Date;
            points: number;
            action: string;
            requestId: string | null;
        }[];
    }>;
    getClientLevelForUser(userId: string): Promise<{
        level: string;
        emoji: string;
        label: string;
    }>;
    awardCreateRequest(userId: string, requestId: string): Promise<void>;
    awardRating(userId: string, requestId: string, hasComment: boolean): Promise<{
        pointsAwarded: number;
        bonusFirstRating: boolean;
    }>;
    sendRatingReminders(): Promise<{
        sent: number;
    }>;
}
