import { NotificationService } from './notification.service';
import { RegisterTokenDto } from './dto/register-token.dto';
export declare class PushTokenController {
    private readonly notificationService;
    constructor(notificationService: NotificationService);
    register(req: any, dto: RegisterTokenDto): Promise<{
        success: boolean;
        message: string;
    } | {
        success: boolean;
        message?: undefined;
    }>;
    remove(body: {
        token: string;
    }): Promise<{
        success: boolean;
    }>;
}
