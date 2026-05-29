import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getProfile(userId: string): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        phone: string;
        documentId: string;
        profileImageUrl: string | null;
        roles: any[];
    }>;
    updateProfile(userId: string, dto: UpdateProfileDto): Promise<{
        id: string;
        firstName: string;
        lastName: string;
        phone: string;
        profileImageUrl: string | null;
        updatedAt: string;
    }>;
}
