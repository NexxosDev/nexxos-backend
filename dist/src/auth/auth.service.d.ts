import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { EmailVerificationService } from './email-verification.service';
import { RegistrationCodeService } from './registration-code.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { PlansService } from '../plans/plans.service';
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    private readonly emailVerificationService;
    private readonly registrationCodeService;
    private readonly configService;
    private readonly plansService;
    private readonly logger;
    constructor(prisma: PrismaService, jwtService: JwtService, emailVerificationService: EmailVerificationService, registrationCodeService: RegistrationCodeService, configService: ConfigService, plansService: PlansService);
    signup(dto: SignupDto): Promise<{
        token: string;
        user: {
            id: string;
            email: string;
            name: string;
            firstName: string;
            lastName: string;
            emailVerified: boolean;
            roles: any[];
        };
    }>;
    login(dto: LoginDto): Promise<{
        token: string;
        user: {
            id: string;
            email: string;
            name: string;
            firstName: string;
            lastName: string;
            emailVerified: boolean;
            roles: any[];
        };
    }>;
    getMe(userId: string): Promise<{
        user: {
            id: string;
            email: string;
            name: string;
            firstName: string;
            lastName: string;
            phone: string;
            documentId: string;
            emailVerified: boolean;
            profileImageUrl: string | null;
            roles: any[];
            hasVendorProfile: boolean;
        };
    }>;
    upgradeToVendor(userId: string, dto: import('./dto/upgrade-to-vendor.dto').UpgradeToVendorDto): Promise<{
        success: boolean;
        user: {
            id: string;
            email: string;
            name: string;
            firstName: string;
            lastName: string;
            emailVerified: boolean;
            roles: any[];
            hasVendorProfile: boolean;
        };
    }>;
    deleteAccount(userId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    private extractS3Key;
    private generateToken;
}
