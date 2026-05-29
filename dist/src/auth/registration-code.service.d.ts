import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
export declare class RegistrationCodeService {
    private readonly prisma;
    private readonly configService;
    private readonly logger;
    private resend;
    constructor(prisma: PrismaService, configService: ConfigService);
    sendCode(email: string): Promise<{
        success: boolean;
        expiresIn: number;
    }>;
    verifyCode(email: string, code: string): Promise<{
        verified: boolean;
    }>;
    isEmailVerified(email: string): Promise<boolean>;
    private buildEmailHtml;
}
