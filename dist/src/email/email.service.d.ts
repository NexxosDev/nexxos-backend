import { ConfigService } from '@nestjs/config';
export declare class EmailService {
    private configService;
    private readonly logger;
    private transporter;
    constructor(configService: ConfigService);
    private initializeTransporter;
    sendVerificationEmail(email: string, token: string, firstName: string): Promise<void>;
    sendPasswordResetEmail(email: string, firstName: string, resetLink: string): Promise<void>;
}
