import { IdentityService } from './identity.service';
import { VerifyIdentityDto } from './dto/verify-identity.dto';
export declare class IdentityController {
    private readonly identityService;
    constructor(identityService: IdentityService);
    verify(dto: VerifyIdentityDto): Promise<{
        match: boolean;
        liveness: boolean;
        confidence: any;
        reason: any;
    }>;
}
