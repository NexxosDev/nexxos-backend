import { PrismaService } from '../prisma/prisma.service';
export declare class SuggestionsService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    createSuggestion(text: string, userId: string): Promise<{
        success: boolean;
    }>;
}
