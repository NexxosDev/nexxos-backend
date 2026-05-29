import { RegistrationCodeService } from './registration-code.service';
declare class SendCodeDto {
    email: string;
}
declare class VerifyCodeDto {
    email: string;
    code: string;
}
export declare class RegistrationCodeController {
    private readonly registrationCodeService;
    constructor(registrationCodeService: RegistrationCodeService);
    sendCode(dto: SendCodeDto): Promise<{
        success: boolean;
        expiresIn: number;
    }>;
    verifyCode(dto: VerifyCodeDto): Promise<{
        verified: boolean;
    }>;
}
export {};
