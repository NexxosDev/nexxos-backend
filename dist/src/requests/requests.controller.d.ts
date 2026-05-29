import { RequestsService } from './requests.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { CloseRequestDto } from './dto/close-request.dto';
import { UpdateResponseTagsDto } from './dto/update-response-tags.dto';
import { RateVendorDto } from './dto/rate-vendor.dto';
export declare class RequestsCronController {
    private readonly requestsService;
    constructor(requestsService: RequestsService);
    expandRadii(): Promise<{
        expanded: number;
        maxReached: number;
    }>;
}
export declare class RequestsController {
    private readonly requestsService;
    constructor(requestsService: RequestsService);
    create(userId: string, dto: CreateRequestDto): Promise<{
        id: string;
        status: string;
        matchedVendorsCount: number;
        createdAt: string;
    }>;
    list(userId: string, status?: string, hasResponses?: string, limit?: string, offset?: string): Promise<{
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
    getPendingRatings(userId: string): Promise<{
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
    getDetail(userId: string, id: string): Promise<{
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
    getResponses(userId: string, id: string): Promise<{
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
    close(userId: string, id: string, dto: CloseRequestDto): Promise<{
        id: string;
        status: string;
        closedAt: string;
    }>;
    rateVendor(userId: string, id: string, dto: RateVendorDto): Promise<{
        success: boolean;
        pointsAwarded: number;
        bonusFirstRating: boolean;
    }>;
    updateTags(userId: string, responseId: string, dto: UpdateResponseTagsDto): Promise<{
        responseId: string;
        tags: string[];
    }>;
}
