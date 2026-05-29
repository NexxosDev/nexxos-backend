import { RequestsService } from './requests.service';
import { RespondRequestDto } from './dto/respond-request.dto';
export declare class VendorRequestsController {
    private readonly requestsService;
    constructor(requestsService: RequestsService);
    list(userId: string, status?: string, limit?: string, offset?: string): Promise<{
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
    getDetail(userId: string, matchId: string): Promise<{
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
    respond(userId: string, matchId: string, dto: RespondRequestDto): Promise<{
        responseId: string;
        chatId: string;
        createdAt: string;
    }>;
    decline(userId: string, matchId: string): Promise<{
        success: boolean;
    }>;
}
