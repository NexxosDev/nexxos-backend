import { PrismaService } from '../prisma/prisma.service';
export declare class UploadService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    getPresignedUrl(userId: string, fileName: string, contentType: string, isPublic: boolean): Promise<{
        uploadUrl: string;
        cloud_storage_path: string;
    }>;
    completeUpload(userId: string, cloud_storage_path: string, fileName: string, contentType: string): Promise<{
        id: string;
        cloud_storage_path: string;
        url: string;
    }>;
    completeRegistrationUpload(cloud_storage_path: string, fileName: string, contentType: string): Promise<{
        cloud_storage_path: string;
        url: string;
    }>;
    getFileUrlById(fileId: string, mode: string): Promise<{
        url: string;
    }>;
}
