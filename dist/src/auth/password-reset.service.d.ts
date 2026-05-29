import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
export declare class PasswordResetService {
    private readonly prisma;
    private readonly configService;
    private readonly logger;
    private resend;
    constructor(prisma: PrismaService, configService: ConfigService);
    sendResetCode(email: string): Promise<{
        success: boolean;
        expiresIn: number;
    }>;
    verifyResetCode(email: string, code: string): Promise<{
        verified: boolean;
    }>;
    resetPasswordWithCode(email: string, code: string, newPassword: string): Promise<void>;
    private buildEmailHtml;
}
