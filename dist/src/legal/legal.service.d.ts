import { PrismaService } from '../prisma/prisma.service';
export declare class LegalService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    findAll(): Promise<{
        id: string;
        key: string;
        title: string;
        updatedAt: Date;
    }[]>;
    findByKey(key: string): Promise<{
        id: string;
        createdAt: Date;
        key: string;
        title: string;
        content: string;
        updatedAt: Date;
    }>;
    update(key: string, content: string, title?: string): Promise<{
        id: string;
        createdAt: Date;
        key: string;
        title: string;
        content: string;
        updatedAt: Date;
    }>;
}
