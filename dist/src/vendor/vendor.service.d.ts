import { PrismaService } from '../prisma/prisma.service';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { ClientPointsService } from '../client-points/client-points.service';
export declare class VendorService {
    private readonly prisma;
    private readonly clientPointsService;
    private readonly logger;
    constructor(prisma: PrismaService, clientPointsService: ClientPointsService);
    getVendorProfile(userId: string): Promise<{
        id: string;
        userId: string;
        businessName: string;
        rif: string;
        logoUrl: string | null;
        facadeImageUrl: string | null;
        country: string | null;
        city: string | null;
        state: string | null;
        municipality: string | null;
        parish: string | null;
        street: string | null;
        postalCode: string | null;
        latitude: number | null;
        longitude: number | null;
        referencePoint: string | null;
        fullAddress: string | null;
        isAvailable: boolean;
        vehicleModels: {
            id: any;
            name: any;
            brand: {
                id: any;
                name: any;
            };
        }[];
        partSubcategories: {
            id: any;
            name: any;
            category: {
                id: any;
                name: any;
            };
        }[];
        metrics: {
            totalRequestsReceived: number;
            totalRequestsAnswered: number;
            avgRating: number | null;
            totalRatings: number;
        };
    }>;
    getVendorById(vendorId: string): Promise<{
        id: string;
        businessName: string;
        rif: string;
        logoUrl: string | null;
        facadeImageUrl: string | null;
        country: string | null;
        city: string | null;
        state: string | null;
        municipality: string | null;
        fullAddress: string | null;
        isAvailable: boolean;
        metrics: {
            totalRequestsReceived: number;
            totalRequestsAnswered: number;
            avgRating: number | null;
            totalRatings: number;
        } | null;
    }>;
    updateVendor(userId: string, dto: UpdateVendorDto): Promise<{
        id: string;
        businessName: string;
        rif: string;
        logoUrl: string | null;
        facadeImageUrl: string | null;
        updatedAt: string;
    }>;
    toggleAvailability(userId: string, isAvailable: boolean): Promise<{
        isAvailable: boolean;
    }>;
    getDashboard(userId: string): Promise<{
        businessName: string;
        isAvailable: boolean;
        metrics: {
            totalRequestsReceived: number;
            totalRequestsAnswered: number;
            avgRating: number | null;
            totalRatings: number;
        };
        recentRequests: {
            matchId: any;
            request: {
                id: any;
                vehicleBrand: any;
                vehicleModel: any;
                partCategory: any;
                partSubcategory: any;
                municipality: any;
                state: any;
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
            deliveredAt: any;
            respondedAt: any;
            declinedAt: any;
            responded: boolean;
            declined: boolean;
        }[];
    }>;
    getResponseTimeMetrics(userId: string): Promise<{
        totalResponded: number;
        totalReceived: number;
        responseRate: number;
        avgResponseTimeMs: number | null;
        medianResponseTimeMs: number | null;
        fastestResponseTimeMs: number | null;
        slowestResponseTimeMs: number | null;
    }>;
    private readonly DEFAULT_QUICK_REPLIES;
    private getVendorId;
    getQuickReplies(userId: string): Promise<{
        id: any;
        messageText: any;
        order: any;
    }[]>;
    createQuickReply(userId: string, messageText: string): Promise<{
        id: string;
        messageText: string;
        order: number;
    }>;
    updateQuickReply(userId: string, replyId: string, messageText: string): Promise<{
        id: string;
        messageText: string;
        order: number;
    }>;
    deleteQuickReply(userId: string, replyId: string): Promise<{
        success: boolean;
    }>;
    reorderQuickReplies(userId: string, items: {
        id: string;
        order: number;
    }[]): Promise<{
        id: any;
        messageText: any;
        order: any;
    }[]>;
}
