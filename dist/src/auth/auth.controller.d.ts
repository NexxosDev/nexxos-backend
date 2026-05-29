import { AuthService } from './auth.service';
import { PasswordResetService } from './password-reset.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyResetCodeDto } from './dto/verify-reset-code.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpgradeToVendorDto } from './dto/upgrade-to-vendor.dto';
export declare class AuthController {
    private readonly authService;
    private readonly passwordResetService;
    constructor(authService: AuthService, passwordResetService: PasswordResetService);
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
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        success: boolean;
        expiresIn: number;
        message: string;
    }>;
    verifyResetCode(dto: VerifyResetCodeDto): Promise<{
        success: boolean;
        verified: boolean;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        success: boolean;
        message: string;
    }>;
    upgradeToVendor(userId: string, dto: UpgradeToVendorDto): Promise<{
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
}
