import { ClientPointsService } from './client-points.service';
export declare class ClientPointsController {
    private readonly pointsService;
    constructor(pointsService: ClientPointsService);
    getPoints(req: any): Promise<{
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
    sendRatingReminders(): Promise<{
        sent: number;
    }>;
}
