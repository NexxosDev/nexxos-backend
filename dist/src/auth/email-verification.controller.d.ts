import { EmailVerificationService } from './email-verification.service';
export declare class EmailVerificationController {
    private readonly emailVerificationService;
    constructor(emailVerificationService: EmailVerificationService);
    verifyEmail(token: string): Promise<{
        success: boolean;
        message: string;
    }>;
    resendVerification(email: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
