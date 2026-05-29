import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { CloseRequestDto } from './dto/close-request.dto';
import { RespondRequestDto } from './dto/respond-request.dto';
import { NotificationService } from '../notification/notification.service';
import { PlansService } from '../plans/plans.service';
import { ClientPointsService } from '../client-points/client-points.service';
export declare class RequestsService {
    private readonly prisma;
    private readonly configService;
    private readonly notificationService;
    private readonly plansService;
    private readonly clientPointsService;
    private readonly logger;
    constructor(prisma: PrismaService, configService: ConfigService, notificationService: NotificationService, plansService: PlansService, clientPointsService: ClientPointsService);
    private haversineKm;
    createRequest(clientId: string, dto: CreateRequestDto): Promise<{
        id: string;
        status: string;
        matchedVendorsCount: number;
        createdAt: string;
    }>;
    listClientRequests(clientId: string, status?: string, hasResponses?: string, limit?: number, offset?: number): Promise<{
        items: {
            id: any;
            vehicleBrand: any;
            vehicleModel: any;
            partCategory: any;
            partSubcategory: any;
            status: any;
            responseCount: any;
            hasRating: boolean | null;
            state: any;
            municipality: any;
            lastMessageAt: any;
            createdAt: any;
        }[];
        total: number;
    }>;
    getRequestDetail(requestId: string, userId: string): Promise<{
        id: string;
        vehicleBrand: {
            id: string;
            name: string;
        };
        vehicleModel: {
            id: string;
            name: string;
        };
        partCategory: {
            id: string;
            name: string;
        };
        partSubcategory: {
            id: string;
            name: string;
        } | null;
        state: {
            id: string;
            name: string;
        } | null;
        municipality: {
            id: string;
            name: string;
        } | null;
        parish: {
            id: string;
            name: string;
        } | null;
        searchRadiusKm: number | null;
        originalRadiusKm: number | null;
        freeDescription: string;
        status: string;
        responseCount: number;
        createdAt: string;
        closedAt: string | null;
    }>;
    getRequestResponses(requestId: string, clientId: string): Promise<{
        items: {
            id: any;
            vendor: {
                id: any;
                businessName: any;
                logoUrl: string | null;
                facadeImageUrl: string | null;
                avgRating: any;
                latitude: any;
                longitude: any;
            };
            initialMessage: any;
            chatId: string | null;
            distanceKm: number | null;
            tags: any[];
            createdAt: any;
        }[];
    }>;
    private recalcVendorMetrics;
    closeRequest(requestId: string, clientId: string, dto: CloseRequestDto): Promise<{
        id: string;
        status: string;
        closedAt: string;
    }>;
    rateVendorOnClosedRequest(requestId: string, clientId: string, vendorId: string, rating: number, comment?: string): Promise<{
        success: boolean;
        pointsAwarded: number;
        bonusFirstRating: boolean;
    }>;
    getPendingRatings(clientId: string): Promise<{
        items: {
            requestId: any;
            description: any;
            createdAt: any;
            vehicle: string;
            category: any;
            vendors: any[];
        }[];
        total: number;
    }>;
    listVendorRequests(userId: string, status?: string, limit?: number, offset?: number): Promise<{
        items: {
            matchId: any;
            request: {
                id: any;
                vehicleBrand: any;
                vehicleModel: any;
                partCategory: any;
                partSubcategory: any;
                freeDescription: any;
                municipality: any;
                state: any;
                searchRadiusKm: any;
                lastMessageAt: any;
                createdAt: any;
                clientFirstName: any;
                clientLastName: any;
                clientLevel: {
                    level: string;
                    emoji: string;
                    label: string;
                };
            };
            status: string;
            respondedAt: any;
            declinedAt: any;
        }[];
        total: number;
    }>;
    getVendorMatchDetail(userId: string, matchId: string): Promise<{
        matchId: string;
        request: {
            id: string;
            vehicleBrand: string;
            vehicleModel: string;
            partCategory: string;
            partSubcategory: string | null;
            freeDescription: string;
            municipality: string | null;
            state: string | null;
            parish: string | null;
            searchRadiusKm: number | null;
            originalRadiusKm: number | null;
            createdAt: string;
            clientFirstName: string;
            clientLastName: string;
            status: string;
        };
        status: string;
        chatId: string | null;
    }>;
    respondToRequest(userId: string, matchId: string, dto: RespondRequestDto): Promise<{
        responseId: string;
        chatId: string;
        createdAt: string;
    }>;
    declineRequest(userId: string, matchId: string): Promise<{
        success: boolean;
    }>;
    updateResponseTags(responseId: string, userId: string, tags: string[]): Promise<{
        responseId: string;
        tags: string[];
    }>;
    private static readonly EXPANSION_STEP_KM;
    private static readonly MAX_RADIUS_KM;
    private static readonly MAX_EXPANSIONS;
    private static readonly WAIT_MINUTES;
    expandSearchRadii(): Promise<{
        expanded: number;
        maxReached: number;
    }>;
}
