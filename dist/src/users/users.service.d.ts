import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
export declare class UsersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
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
