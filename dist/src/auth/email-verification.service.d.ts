import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
export declare class EmailVerificationService {
    private prisma;
    private emailService;
    constructor(prisma: PrismaService, emailService: EmailService);
    sendVerificationEmail(userId: string): Promise<void>;
    verifyEmail(token: string): Promise<void>;
    resendVerificationEmail(email: string): Promise<void>;
}
