import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
export declare class IdentityService {
    private readonly prisma;
    private readonly config;
    private readonly logger;
    constructor(prisma: PrismaService, config: ConfigService);
    verifyIdentity(documentImageUrl: string, selfieNeutralUrl: string, selfieSmileUrl: string, selfieTurnUrl: string): Promise<{
        match: boolean;
        liveness: boolean;
        confidence: any;
        reason: any;
    }>;
    private callLLM;
}
